/**
 * CampusScene
 *
 * Imperative Three.js scene for /3d: extrudes the real joined campus
 * polygons (campus-polygons.geojson — OSM + Microsoft ML footprints,
 * the very same data as the /map volumes) and colors named venues by
 * live room-availability status.
 *
 * Draw-call budget (fuoye-explore-inspired, orbit-only v1):
 * - ~30 named venues: individual meshes + edge lines + label sprites
 *   (~95 draw calls) — these participate in raycast picking
 * - ~250 unnamed ML detections: merged into ONE Lambert mesh + ONE edge
 *   lines object (2 draw calls) — visible set dressing, not pickable
 * - Lambert materials, no postprocessing, no shadow maps
 * - render-on-demand: the rAF loop renders only when the camera moved
 *
 * This component imports `three` directly, so it must stay behind the
 * lazy route/page boundary — /map and the rest of the app never pay
 * for the ~150 kB gzip chunk.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { BuildingStatus } from "@/hooks/useBuildingStatus";

const STATUS_TO_HEX: Record<BuildingStatus, number> = {
  FREE: 0x10b981,
  ENDING_SOON: 0xf59e0b,
  OCCUPIED: 0xef4444,
  UNKNOWN: 0xb9c2cf,
};
const GROUND_HEX = 0xe7e2d5;
const SKY_HEX = 0xf0ebdf;

// ~22% darker for edge lines — cheap "depth" cue without shadow maps.
const darken = (hex: number, f = 0.78): number => {
  const r = Math.round(((hex >> 16) & 0xff) * f);
  const g = Math.round(((hex >> 8) & 0xff) * f);
  const b = Math.round((hex & 0xff) * f);
  return (r << 16) | (g << 8) | b;
};

interface PolygonProps {
  slug: string;
  title: string;
  category: string;
  named: boolean;
  height_est: number;
  source: string;
  center?: [number, number];
}

type PolygonFeature = {
  type: "Feature";
  geometry:
    | { type: "Polygon"; coordinates: number[][][] }
    | { type: string; coordinates?: unknown };
  properties: PolygonProps;
};

interface CampusSceneProps {
  /** slug -> availability status; recolors meshes without rebuilding. */
  statusBySlug: Map<string, BuildingStatus>;
  /** Fired on tap: the venue slug, or "" when the user taps empty space. */
  onSelect: (slug: string) => void;
  /** Current selection: venue slug to orbit into, "" to return to the
   * campus fit, null = do nothing (initial state). */
  focusSlug?: string | null;
}

/** Equirectangular meters-per-degree at the campus latitude. */
const M_PER_DEG_LNG = 111320 * Math.cos((5.042 * Math.PI) / 180);
const M_PER_DEG_LAT = 110540;
const STATUSES: BuildingStatus[] = ["FREE", "ENDING_SOON", "OCCUPIED", "UNKNOWN"];

/** Point-in-ring signed area; flips rings so triangulation never fails. */
const signedArea = (ring: number[][]): number => {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += (ring[i][0] - ring[i + 1][0]) * (ring[i][1] + ring[i + 1][1]);
  }
  return a / 2;
};

/** Deterministic tiny hash for label jitter — stable across reloads. */
const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export default function CampusScene({
  statusBySlug,
  onSelect,
  focusSlug = null,
}: CampusSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Latest props without tearing the scene down when statuses refresh.
  const statusRef = useRef(statusBySlug);
  const selectRef = useRef(onSelect);
  statusRef.current = statusBySlug;
  selectRef.current = onSelect;

  const [failed, setFailed] = useState(false);
  // Camera-flight handle exposed from the imperative effect to the
  // declarative focus effect (below).
  const apiRef = useRef<{
    focus: (slug: string) => void;
    unFocus: () => void;
    ready: boolean;
  } | null>(null);

  const featuresPromise = useMemo(
    () =>
      fetch(`${import.meta.env.BASE_URL}data/campus-polygons.geojson`)
        .then((r) =>
          r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)),
        )
        .then(
          (j: { features: PolygonFeature[] }) =>
            j.features.filter(
              (f) =>
                f.properties?.source !== "hand-box" &&
                f.geometry?.type === "Polygon",
            ) as PolygonFeature[],
        ),
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let raf = 0;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      console.warn("[3d] WebGL unavailable:", err);
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(SKY_HEX);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(SKY_HEX, 1600, 3400);

    const camera = new THREE.PerspectiveCamera(48, 1, 2, 5200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    // Keep the horizon above the floor so the sky never meets the ground.
    controls.maxPolarAngle = Math.PI / 2.12;
    controls.minDistance = 60;
    controls.maxDistance = 1800;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb3a992, 2.1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(260, 480, 180);
    scene.add(dirLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(6000, 6000),
      new THREE.MeshLambertMaterial({ color: GROUND_HEX }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const grid = new THREE.GridHelper(2400, 48, 0xd8d2c4, 0xdedad0);
    grid.position.y = 0.15;
    scene.add(grid);
    // Roof materials carry the status color (caps) only as a FALLBACK —
    // when terrain imagery is available, named venues get real satellite
    // roof crops (see fetch-satellite.mjs) and status moves to the
    // tinted label pill.
    const roofMats = new Map<BuildingStatus, THREE.MeshLambertMaterial>();
    const lineMats = new Map<BuildingStatus, THREE.LineBasicMaterial>();
    for (const s of STATUSES) {
      roofMats.set(s, new THREE.MeshLambertMaterial({ color: STATUS_TO_HEX[s] }));
      lineMats.set(s, new THREE.LineBasicMaterial({ color: darken(STATUS_TO_HEX[s]) }));
    }
    const unnamedRoofMat = new THREE.MeshLambertMaterial({ color: 0x99a1ab });
    const unnamedLineMat = new THREE.LineBasicMaterial({ color: darken(0x99a1ab) });
    const oneOffs: Array<THREE.Texture | THREE.Material> = [];

    const pickables: THREE.Mesh[] = [];
    const labels: THREE.Sprite[] = [];
    // Venue centroids for tap-to-focus + the fitted-camera pose for the
    // intro dolly and "back to campus" — populated during scene build,
    // consumed by the focus effect through apiRef.
    const centers = new Map<string, { x: number; y: number; z: number; h: number }>();
    const fitPos = new THREE.Vector3();
    const fitTarget = new THREE.Vector3();
    let camAnim: {
      t0: number;
      dur: number;
      fromPos: THREE.Vector3;
      toPos: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toTarget: THREE.Vector3;
    } | null = null;
    const animateTo = (toPos: THREE.Vector3, toTarget: THREE.Vector3, dur = 1100) => {
      camAnim = {
        t0: performance.now(),
        dur,
        fromPos: camera.position.clone(),
        toPos: toPos.clone(),
        fromTarget: controls.target.clone(),
        toTarget: toTarget.clone(),
      };
    };

    /**
     * Procedural window-grid wall texture. ExtrudeGeometry UVs are in
     * world meters, so a RepeatWrapping texture with repeat = (1/3.6,
     * 1/3.4) yields one window column every ~3.6 m of wall and one band
     * every ~3.4 m of height — a storey for free, on every building
     * (including the merged unnamed pool), for one canvas + one draw
     * call of texture cost.
     */
    const wallTexture = (() => {
      const c = document.createElement("canvas");
      c.width = 128;
      c.height = 128;
      const x = c.getContext("2d");
      if (x) {
        x.fillStyle = "#f5f2ea";
        x.fillRect(0, 0, 128, 128);
        x.fillStyle = "#5f6b78";
        // 2 window columns × 2 window rows per texture tile.
        x.fillRect(14, 16, 42, 34);
        x.fillRect(72, 16, 42, 34);
        x.fillRect(14, 78, 42, 34);
        x.fillRect(72, 78, 42, 34);
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1 / 3.6, 1 / 3.4);
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      return t;
    })();
    const wallMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      map: wallTexture,
    });

    const labelSprite = (text: string): THREE.Sprite => {
      const truncated = text.length > 22 ? `${text.slice(0, 21)}…` : text;
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        const pad = 20;
        const w = canvas.width - pad * 2;
        const h = canvas.height - pad * 2;
        ctx.beginPath();
        // roundRect needs Chrome 99+/Safari 16.4+; older WebViews rect() it.
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(pad, pad, w, h, 26);
        } else {
          ctx.rect(pad, pad, w, h);
        }
        ctx.fill();
        ctx.fillStyle = "#1e293b";
        ctx.font = "700 44px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(truncated, canvas.width / 2, canvas.height / 2 + 2, w - 30);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, depthWrite: false }),
      );
      sprite.scale.set(30, 7.5, 1);
      return sprite;
    };

    // Recolor shared materials when statuses arrive/change. Buildings
    // with a real satellite roof keep it (roof stays LOAD); availability
    // shows on the label pill tint + edge lines.
    const PILL_TINT: Record<BuildingStatus, number> = {
      FREE: 0xbdf0dd,
      ENDING_SOON: 0xffe8c2,
      OCCUPIED: 0xffd4d4,
      UNKNOWN: 0xffffff,
    };
    const applyStatuses = () => {
      for (const mesh of pickables) {
        const ud = mesh.userData as {
          slug: string;
          line?: THREE.LineSegments;
          roofMat?: THREE.MeshLambertMaterial;
          roofLoaded?: boolean;
        };
        const status: BuildingStatus = statusRef.current.get(ud.slug) ?? "UNKNOWN";
        const roof = ud.roofLoaded && ud.roofMat ? ud.roofMat : (roofMats.get(status) ?? roofMats.get("UNKNOWN")!);
        mesh.material = [roof, wallMat];
        if (ud.line) {
          ud.line.material = lineMats.get(status) ?? lineMats.get("UNKNOWN")!;
        }
      }
      for (const sprite of labels) {
        const { slug } = sprite.userData as { slug: string };
        const status: BuildingStatus = statusRef.current.get(slug) ?? "UNKNOWN";
        (sprite.material as THREE.SpriteMaterial).color.setHex(PILL_TINT[status]);
      }
      needsRender = true;
    };

    let needsRender = true;

    void featuresPromise
      .then((features) => {
        if (disposed) return;
        if (features.length === 0) throw new Error("no polygon data");

        // Auto-center on the data so CAMPUS_CENTER drift can't desync us.
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
        for (const f of features) {
          const g = f.geometry as { type: "Polygon"; coordinates: number[][][] };
          for (const [lng, lat] of g.coordinates[0]) {
            minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
          }
        }
        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;
        const toX = (lng: number) => (lng - centerLng) * M_PER_DEG_LNG;
        const toZ = (lat: number) => (lat - centerLat) * M_PER_DEG_LAT;

        const namedGroup = new THREE.Group();
        const unnamedGeos: THREE.ExtrudeGeometry[] = [];

        for (const f of features) {
          const p = f.properties;
          const g = f.geometry as { type: "Polygon"; coordinates: number[][][] };
          const outer = g.coordinates[0];
          if (outer.length < 4) continue;
          const ring = signedArea(outer) < 0 ? [...outer].reverse() : outer;

          const shape = new THREE.Shape(
            ring
              .slice(0, -1)
              .map(([lng, lat]) => new THREE.Vector2(toX(lng), -toZ(lat))),
          );
          // Unnamed ML volumes get ±1.1 m deterministic jitter: ML
          // detections occasionally overlap, and exactly-equal top faces
          // between a grey blob and a colored venue would shimmer
          // (z-fighting). Distinct offsets prevent coincident surfaces.
          const base = Math.max(Number(p.height_est) || 9, 3);
          const height = p.named
            ? base
            : base + ((hashStr(p.slug) % 230) / 100 - 1.15);

          const geo = new THREE.ExtrudeGeometry(shape, {
            depth: height,
            bevelEnabled: false,
          });
          geo.rotateX(-Math.PI / 2); // extrusion +Z -> world up (+Y)

          // Label anchor: the ring centroid (mean of the unique points),
          // NOT the pin — matched feetprints can sit tens of meters from
          // their hand-pin, and a pin-anchored label floats in space.
          let cx = 0;
          let cz = 0;
          const unique = ring.length > 1 ? ring.slice(0, -1) : ring;
          for (const [lng, lat] of unique) {
            cx += toX(lng);
            cz += -toZ(lat);
          }
          cx /= unique.length;
          cz /= unique.length;

          if (!p.named) {
            unnamedGeos.push(geo);
            continue;
          }

          const mesh = new THREE.Mesh(geo, [
            roofMats.get("UNKNOWN")!,
            wallMat,
          ]);
          mesh.userData = { slug: p.slug };
          mesh.renderOrder = 1;
          namedGroup.add(mesh);
          pickables.push(mesh);

          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geo, 18),
            unnamedLineMat,
          );
          edges.renderOrder = 2;
          namedGroup.add(edges);
          mesh.userData = { slug: p.slug, line: edges };

          const sprite = labelSprite(p.title);
          sprite.position.set(cx, height + 3, cz);
          sprite.userData = { slug: p.slug };
          namedGroup.add(sprite);
          labels.push(sprite);

          centers.set(p.slug, { x: cx, y: height / 2, z: cz, h: height });
        }

        // Unnamed pool: one merged mesh + one merged edges object —
        // ~250 detections for ~2 draw calls. use_groups preserves each
        // building's cap/wall material groups so the merged blob gets the
        // window texture too.
        if (unnamedGeos.length) {
          const merged = mergeGeometries(unnamedGeos, true);
          if (merged) {
            const blob = new THREE.Mesh(merged, [unnamedRoofMat, wallMat]);
            scene.add(blob);
            const blobEdges = new THREE.LineSegments(
              new THREE.EdgesGeometry(merged, 26),
              unnamedLineMat,
            );
            blobEdges.renderOrder = 2;
            scene.add(blobEdges);
            for (const geo of unnamedGeos) geo.dispose(); // merged and retired
          } else {
            // mergeGeometries unavailable for these rings — fall back to
            // individual meshes (disposal: scene traverse at cleanup).
            for (const geo of unnamedGeos) {
              scene.add(new THREE.Mesh(geo, [unnamedRoofMat, wallMat]));
            }
          }
        }

        scene.add(namedGroup);

        // Fit the camera to the campus extent.
        const span = Math.max(
          (maxLng - minLng) * M_PER_DEG_LNG,
          (maxLat - minLat) * M_PER_DEG_LAT,
        );
        const dist = Math.min(Math.max(span * 0.62, 260), 900);
        camera.position.set(dist * 0.25, dist * 0.75, dist * 0.8);
        controls.update();

        // Fitted pose + intro dolly: start 1.4x farther out and higher,
        // glide in — arrival beats an instant jump.
        fitPos.copy(camera.position);
        fitTarget.copy(controls.target);
        const introDir = camera.position.clone().sub(controls.target);
        camera.position
          .copy(controls.target)
          .addScaledVector(introDir, 1.45)
          .add(new THREE.Vector3(0, dist * 0.22, 0));
        animateTo(fitPos, fitTarget, 1600);

        // ---- satellite terrain (build-time fetched: `bun run fetch:satellite`) ----
        // Real imagery as ground (roads, grass, paths) + as the ROOF crops
        // of named venues. Falls back to flat ground + status-colored
        // roofs when public/terrain is missing.
        const texLoader = new THREE.TextureLoader();
        void fetch(`${import.meta.env.BASE_URL}terrain/index.json`)
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no terrain"))))
          .then(
            (
              manifest: {
                ground?: { bbox: number[] };
                roofs?: Record<string, { bbox: number[] }>;
              },
            ) => {
              if (disposed) return;

              if (manifest.ground?.bbox) {
                const [gMinLng, gMinLat, gMaxLng, gMaxLat] = manifest.ground.bbox;
                const gw = (gMaxLng - gMinLng) * M_PER_DEG_LNG;
                const gh = (gMaxLat - gMinLat) * M_PER_DEG_LAT;
                texLoader.load(
                  `${import.meta.env.BASE_URL}terrain/campus-sat.jpg`,
                  (tex) => {
                    if (disposed) return;
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.generateMipmaps = true;
                    tex.minFilter = THREE.LinearMipmapLinearFilter;
                    const mat = new THREE.MeshLambertMaterial({ map: tex });
                    oneOffs.push(tex, mat);
                    const img = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), mat);
                    img.rotation.x = -Math.PI / 2;
                    img.position.set(
                      ((gMinLng + gMaxLng) / 2 - centerLng) * M_PER_DEG_LNG,
                      0.06,
                      -(((gMinLat + gMaxLat) / 2 - centerLat) * M_PER_DEG_LAT),
                    );
                    scene.add(img);
                    grid.visible = false; // CAD grid redundant over real imagery
                    needsRender = true;
                  },
                  undefined,
                  () => {}, // terrain failed: flat-ground fallback stays
                );
              }

              for (const mesh of pickables) {
                const ud = mesh.userData as {
                  slug: string; roofMat?: THREE.MeshLambertMaterial; roofLoaded?: boolean;
                };
                const entry = manifest.roofs?.[ud.slug];
                if (!entry?.bbox) continue;
                const [rMinLng, rMinLat, rMaxLng, rMaxLat] = entry.bbox;
                const x0 = toX(rMinLng);
                const w = (rMaxLng - rMinLng) * M_PER_DEG_LNG;
                // Shape Y = -toZ(lat): south (low lat) is the LARGE y.
                const ySouth = -toZ(rMinLat);
                const yNorth = -toZ(rMaxLat);
                const h = ySouth - yNorth;

                const roofMat = new THREE.MeshLambertMaterial({ color: 0x8d959f });
                oneOffs.push(roofMat);
                ud.roofMat = roofMat;
                texLoader.load(
                  `${import.meta.env.BASE_URL}terrain/roof-${ud.slug}.jpg`,
                  (tex) => {
                    if (disposed) return;
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    // Cap UVs are raw shape meters: map the image frame
                    // onto the footprint bbox. North must land at v'=1,
                    // so v repeats negative ((ySouth - y) / h).
                    tex.repeat.set(1 / w, -1 / h);
                    tex.offset.set(-x0 / w, ySouth / h);
                    tex.generateMipmaps = true;
                    tex.minFilter = THREE.LinearMipmapLinearFilter;
                    roofMat.map = tex;
                    roofMat.color.setHex(0xffffff);
                    roofMat.needsUpdate = true;
                    ud.roofLoaded = true;
                    applyStatuses();
                    needsRender = true;
                  },
                  undefined,
                  () => {}, // keep the status-colored fallback roof
                );
              }
            },
          )
          .catch(() => {}); // no terrain manifest: confirm fallbacks

        applyStatuses();
        needsRender = true;
      })
      .catch((err) => {
        console.warn("[3d] scene build failed:", err);
        if (!disposed) setFailed(true);
      });

    // ---- interaction: pointer select with a drag threshold ----
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      // A post-orbit drag is not a selection.
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(pickables, false)[0];
      if (hit) {
        const { slug } = hit.object.userData as { slug: string };
        selectRef.current(slug);
      } else {
        selectRef.current("");
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // ---- sizing ----
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      needsRender = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ---- render-on-demand loop ----
    const loop = () => {
      raf = requestAnimationFrame(loop);
      // Camera flights: eased lerp; OrbitControls re-reads camera.position
      // each update, so lerping position+target stays consistent.
      if (camAnim) {
        const t = Math.min(
          Math.max((performance.now() - camAnim.t0) / camAnim.dur, 0),
          1,
        );
        const k = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, k);
        controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget, k);
        if (t >= 1) camAnim = null;
      }
      // controls.update() returns true when the camera transform moved.
      const moved = controls.update();
      if (moved || needsRender) {
        needsRender = false;
        renderer.render(scene, camera);
      }
    };
    raf = requestAnimationFrame(loop);

    // Exposed to the focus effect (lives outside this effect closure).
    apiRef.current = {
      focus: (slug: string) => {
        const c = centers.get(slug);
        if (!c) return;
        const dir = camera.position.clone().sub(controls.target);
        if (dir.lengthSq() < 0.001) dir.set(0.4, 0.7, 0.6);
        dir.normalize();
        const pos = new THREE.Vector3(c.x, c.y, c.z)
          .addScaledVector(dir, Math.max(c.h * 2.4, 95))
          .add(new THREE.Vector3(0, Math.max(c.h * 0.9, 26), 0));
        animateTo(pos, new THREE.Vector3(c.x, c.y, c.z), 1100);
      },
      unFocus: () => animateTo(fitPos, fitTarget, 1300),
      ready: true,
    };

    // Statuses can resolve after first paint (API fetch) — recolor on a
    // slow tick; cheap (shared-material swap, no geometry work).
    const statusTick = window.setInterval(applyStatuses, 1500);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearInterval(statusTick);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
        }
        if (obj instanceof THREE.Sprite) {
          (obj.material as THREE.SpriteMaterial).map?.dispose();
          obj.material.dispose();
        }
      });
      for (const m of roofMats.values()) m.dispose();
      for (const m of lineMats.values()) m.dispose();
      unnamedRoofMat.dispose();
      unnamedLineMat.dispose();
      wallMat.dispose();
      wallTexture.dispose();
      for (const o of oneOffs) o.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // featuresPromise is stable (useMemo []); statuses flow via statusRef.
  }, [featuresPromise]);

  // Declarative side of tap-to-focus: the page lifts the selection into
  // `focusSlug`; this effect translates it into a camera flight.
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !api.ready) return;
    if (focusSlug === null) return; // initial state — leave the camera
    if (focusSlug === "") api.unFocus();
    else api.focus(focusSlug);
  }, [focusSlug]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-center">
        <p className="max-w-sm text-sm text-neutral-600">
          3D scene failed to load — your device or browser may not support
          WebGL. The 2D map has the same availability colors.
        </p>
      </div>
    );
  }
  return <div ref={containerRef} className="h-full w-full" />;
}
