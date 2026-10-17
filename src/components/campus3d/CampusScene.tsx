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
const UNNAMED_HEX = 0xb0b7bf;
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
}: CampusSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Latest props without tearing the scene down when statuses refresh.
  const statusRef = useRef(statusBySlug);
  const selectRef = useRef(onSelect);
  statusRef.current = statusBySlug;
  selectRef.current = onSelect;

  const [failed, setFailed] = useState(false);

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

    // Shared materials — recolors mutate THESE, never rebuild geometry.
    const statusMats = new Map<BuildingStatus, THREE.MeshLambertMaterial>();
    const lineMats = new Map<BuildingStatus, THREE.LineBasicMaterial>();
    for (const s of STATUSES) {
      statusMats.set(s, new THREE.MeshLambertMaterial({ color: STATUS_TO_HEX[s] }));
      lineMats.set(s, new THREE.LineBasicMaterial({ color: darken(STATUS_TO_HEX[s]) }));
    }
    const unnamedMat = new THREE.MeshLambertMaterial({ color: UNNAMED_HEX });
    const unnamedLineMat = new THREE.LineBasicMaterial({ color: darken(UNNAMED_HEX) });

    const pickables: THREE.Mesh[] = [];

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
      sprite.scale.set(46, 11.5, 1);
      return sprite;
    };

    // Recolor shared materials when statuses arrive/change.
    const applyStatuses = () => {
      for (const mesh of pickables) {
        const { slug, line } = mesh.userData as {
          slug: string;
          line?: THREE.LineSegments;
        };
        const status: BuildingStatus = statusRef.current.get(slug) ?? "UNKNOWN";
        mesh.material = statusMats.get(status) ?? statusMats.get("UNKNOWN")!;
        if (line) line.material = lineMats.get(status) ?? lineMats.get("UNKNOWN")!;
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

          if (!p.named) {
            unnamedGeos.push(geo);
            continue;
          }

          const mesh = new THREE.Mesh(geo, unnamedMat);
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

          if (p.center) {
            const sprite = labelSprite(p.title);
            sprite.position.set(toX(p.center[0]), height + 8, -toZ(p.center[1]));
            sprite.userData = { slug: p.slug };
            namedGroup.add(sprite);
          }
        }

        // Unnamed pool: one merged mesh + one merged edges object —
        // ~250 detections for ~2 draw calls.
        if (unnamedGeos.length) {
          const merged = mergeGeometries(unnamedGeos, false);
          if (merged) {
            const blob = new THREE.Mesh(merged, unnamedMat);
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
              scene.add(new THREE.Mesh(geo, unnamedMat));
            }
          }
        }

        scene.add(namedGroup);

        // Fit the camera to the campus extent.
        const span = Math.max(
          (maxLng - minLng) * M_PER_DEG_LNG,
          (maxLat - minLat) * M_PER_DEG_LAT,
        );
        const dist = Math.min(Math.max(span * 0.85, 300), 1100);
        camera.position.set(dist * 0.25, dist * 0.75, dist * 0.8);
        controls.update();

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
      // controls.update() returns true when the camera transform moved.
      const moved = controls.update();
      if (moved || needsRender) {
        needsRender = false;
        renderer.render(scene, camera);
      }
    };
    raf = requestAnimationFrame(loop);

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
      for (const m of statusMats.values()) m.dispose();
      for (const m of lineMats.values()) m.dispose();
      unnamedMat.dispose();
      unnamedLineMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // featuresPromise is stable (useMemo []); statuses flow via statusRef.
  }, [featuresPromise]);

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
