/**
 * build-campus-polygons.mjs
 *
 * Phase 2 — Footprint Join Pipeline (offline-first).
 *
 * Reads point markers from `src/data/campus-buildings.json` and emits
 * polygon volumes to `public/data/campus-polygons.geojson` for 3D extrusion.
 *
 * Two modes:
 *  1. OSM merge (preferred): if `public/data/raw-osm-buildings.geojson`
 *     exists (Polygon/MultiPolygon features from Overpass
 *     `way["building"](bbox)` + Microsoft ML), each hand pin is spatially
 *     joined to its nearest polygon within MATCH_RADIUS_M. Matched polygons
 *     keep real geometry.
 *  2. Fallback boxes: pins with no OSM match become axis-aligned boxes
 *     sized by category. This is what ships today because Overpass is
 *     unreachable from CI/sandbox — geometry is approximate, names are ours.
 *
 * Run: `node scripts/build-campus-polygons.mjs [--osm public/data/raw-osm-buildings.geojson]`
 *
 * Attribution (when OSM file is merged): OSM contributors (ODbL),
 * Microsoft GlobalMLBuildingFootprints (CDLA-2.0). Recorded per-feature
 * in `properties.source` and summarized in `public/data/scene-sources.json`.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILDINGS_JSON = join(root, "src/data/campus-buildings.json");
const JOIN_TS = join(root, "src/data/building-room-join.ts");
const OUT_GEOJSON = join(root, "public/data/campus-polygons.geojson");
const OUT_SOURCES = join(root, "public/data/scene-sources.json");

const MATCH_RADIUS_M = 80;
const BBOX_MIN_LNG = 7.968;
const BBOX_MIN_LAT = 5.034;
const BBOX_MAX_LNG = 7.988;
const BBOX_MAX_LAT = 5.050;

// Box half-sizes (meters, [ew, ns]) by category — footprints, not heights.
const BOX_BY_CATEGORY = {
  teaching: [22, 14],
  library: [20, 14],
  hostel: [20, 12],
  admin: [18, 12],
  market: [14, 10],
  transport: [8, 6],
  landmark: [16, 12],
  other: [14, 10],
};

// Estimated heights (meters) by category.
const HEIGHT_BY_CATEGORY = {
  teaching: 12,
  library: 10,
  hostel: 15,
  admin: 12,
  market: 6,
  transport: 4,
  landmark: 8,
  other: 9,
};

// Per-title overrides for known venues.
const HEIGHT_OVERRIDES = {
  "Science Lecture Theatre (1k Cap)": 8,
  "Agric Lecture Theater": 8,
  "Engineering Lecture Theater": 9,
  "ELF Lecture Theater": 8,
  "Multi-purpose hall": 7,
  "Convocation Park": 6,
  "Bus Stop (Engineering)": 4,
  "Entry point": 4,
};

const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[—–]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Parse slugs out of building-room-join.ts without executing TS:
// matches `"Title": { ... slug: "some-slug" ... }`
function loadJoinSlugs(path) {
  const src = readFileSync(path, "utf8");
  const map = new Map();
  const re = /"([^"]+)"\s*:\s*\{[^}]*?slug:\s*"([^"]+)"/gs;
  let m;
  while ((m = re.exec(src)) !== null) map.set(m[1], m[2]);
  return map;
}

const haversineM = (a, b) => {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.sin(dLng / 2) ** 2;
  const aa = s1 + Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * s2;
  return 2 * R * Math.asin(Math.sqrt(aa));
};

// Ray-casting point-in-polygon on [lng, lat] pairs.
const pointInPolygon = (pt, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersects =
      yi > pt[1] !== yj > pt[1] &&
      pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

const centroidOf = (coords) => {
  // coords: Polygon rings. Use outer ring average (good enough for join).
  const ring = coords[0];
  let x = 0, y = 0;
  for (const p of ring) { x += p[0]; y += p[1]; }
  return [x / ring.length, y / ring.length];
};

function boxAround([lng, lat], hw, hh) {
  // Equirectangular approx — fine for <50m boxes near the equator.
  const dLng = hw / 111320 / Math.cos((lat * Math.PI) / 180);
  const dLat = hh / 110540;
  return [[
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ]];
}

function main() {
  const osmArgIdx = process.argv.indexOf("--osm");
  const osmPath = osmArgIdx !== -1 ? process.argv[osmArgIdx + 1] : join(root, "public/data/raw-open-buildings.geojson");
  const buildings = JSON.parse(readFileSync(BUILDINGS_JSON, "utf8"));
  const joinSlugs = loadJoinSlugs(JOIN_TS);

  // Raw caches merged into one candidate pool, OSM first (hand-curated,
  // best semantics), Microsoft GlobalML second (ML detections — fills
  // venues OSM never mapped: NEB, NECB, Fac. of Science/Computing, 5 ARMS,
  // ICT II, Main Library, Geoscience...). `priority` sorts greedy
  // assignment so an OSM candidate always outranks an ML candidate at the
  // same pin, and committed OSM matches can never regress.
  const candidates = [
    { path: osmPath, label: "open-buildings file", tag: "open-buildings-v3", priority: 0 },
    { path: join(root, "public/data/raw-osm-buildings.geojson"), label: "OSM Overpass cache", tag: "osm", priority: 0 },
    { path: join(root, "public/data/raw-ms-buildings.geojson"), label: "Microsoft GlobalMLBuildingFootprints", tag: "ms-ml", priority: 1 },
  ];
  const footprints = []; // { geometry, properties, tag, priority }
  const usedSources = [];
  for (const cand of candidates) {
    if (!cand.path || !existsSync(cand.path)) continue;
    try {
      const raw = JSON.parse(readFileSync(cand.path, "utf8"));
      const polys = (raw.features ?? []).filter(
        (f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"),
      );
      for (const p of polys) {
        footprints.push({ geometry: p.geometry, properties: p.properties ?? {}, tag: cand.tag, priority: cand.priority });
      }
      if (polys.length) usedSources.push(cand.label);
      console.log(`Merging ${polys.length} polygons from ${cand.path}`);
    } catch (err) {
      console.warn(`${cand.label} unreadable (${err.message}) — skipping source.`);
    }
  }
  if (!footprints.length) {
    console.log("No raw footprint cache found — generating fallback boxes for all pins.");
    console.log("To merge real footprints: bun run fetch:ms (27 MB tile) and/or bun run fetch:buildings (2.5 GB), then re-run this.");
  }

  const usedOsm = new Set();
  let matched = 0;

  // Global greedy assignment across ALL (pin, polygon) pairs:
  // priority (OSM < ML) first — committed OSM matches can never regress —
  // then point-inside costs 0 and is claimed first (fixes the old
  // first-come-first-serve mis-assignment), then by centroid distance,
  // radius-capped.
  const pairs = [];
  buildings.features.forEach((f, pi) => {
    const pt = f.geometry.coordinates;
    footprints.forEach((fp, k) => {
      const g = fp.geometry;
      const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      for (const poly of polys) {
        const inside = pointInPolygon(pt, poly[0]);
        const d = inside ? 0 : haversineM(pt, centroidOf(poly));
        if (d <= MATCH_RADIUS_M) pairs.push({ pin: pi, poly: k, cost: d, priority: fp.priority });
      }
    });
  });
  pairs.sort((a, b) => a.priority - b.priority || a.cost - b.cost);

  const pinMatch = new Map();
  for (const { pin, poly, cost } of pairs) {
    if (pinMatch.has(pin) || usedOsm.has(poly)) continue;
    pinMatch.set(pin, { poly, cost });
    usedOsm.add(poly);
  }

  const features = buildings.features.map((f, i) => {
    const title = f.properties.title;
    const category = f.properties.category ?? "other";
    const pt = f.geometry.coordinates;
    const slug = joinSlugs.get(title) ?? slugify(title);
    const m = pinMatch.get(i);

    let geometry, source, confidence, height_tagged = false, ml_confidence;
    const fp = m ? footprints[m.poly] : null;
    const rawProps = fp ? fp.properties : {};
    const realHeight = Number(rawProps.height_m);
    if (m) {
      const g = fp.geometry;
      const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      geometry = { type: "Polygon", coordinates: polys[0] };
      source = fp.tag;
      confidence = m.cost === 0 ? "high" : m.cost <= 30 ? "high" : "medium";
      matched++;
      if (Number.isFinite(realHeight) && realHeight > 0) height_tagged = true;
      if (fp.tag === "ms-ml" && Number(rawProps.confidence) >= 0) {
        ml_confidence = Number(rawProps.confidence);
      }
    } else {
      const [hw, hh] = BOX_BY_CATEGORY[category] ?? BOX_BY_CATEGORY.other;
      geometry = { type: "Polygon", coordinates: boxAround(pt, hw, hh) };
      source = "hand-box";
      confidence = "low";
    }

    // Tagged heights (OSM height/levels) beat category estimates.
    const height_est = height_tagged
      ? realHeight
      : (HEIGHT_OVERRIDES[title] ? Number(HEIGHT_OVERRIDES[title]) : HEIGHT_BY_CATEGORY[category] ?? 9);
    return {
      type: "Feature",
      id: slug,
      geometry,
      properties: {
        slug,
        title,
        category,
        named: !slug.startsWith("unnamed-"),
        height_est,
        height_tagged,
        ...(Number.isFinite(Number(rawProps.area_m2)) && Number(rawProps.area_m2) > 0
          ? { area_m2: Number(rawProps.area_m2) }
          : {}),
        ...(ml_confidence !== undefined ? { ml_confidence } : {}),
        ...(m ? { match_distance_m: Math.round(m.cost) } : {}),
        source,
        confidence,
        center: pt,
      },
    };
  });

  // Keep genuinely unmatched polygons (real buildings we haven't named).
  // ML detections duplicating an OSM polygon are dropped: the same
  // structure twice renders as double walls (OSM wins — hand-curated
  // beats ML). 10 m centroid distance = same-structure threshold;
  // distinct nearby wings sit farther apart than that.
  let unnamed = 0;
  const osmCentroids = footprints
    .filter((fp) => fp.tag !== "ms-ml")
    .map((fp) => {
      const g = fp.geometry;
      const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      return centroidOf(polys[0]);
    });
  footprints.forEach((fp, k) => {
    if (usedOsm.has(k)) return;
    const g = fp.geometry;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    const c = centroidOf(polys[0]);
    if (fp.tag === "ms-ml" && osmCentroids.some((cc) => haversineM(c, cc) < 10)) return;
    const realHeight = Number(fp.properties?.height_m);
    const tagged = Number.isFinite(realHeight) && realHeight > 0;
    unnamed++;
    features.push({
      type: "Feature",
      id: `unnamed-${unnamed}`,
      geometry: g.type === "Polygon" ? { type: "Polygon", coordinates: polys[0] } : g,
      properties: {
        slug: `unnamed-${unnamed}`,
        title: `Unnamed building ${unnamed}`,
        category: "other",
        named: false,
        height_est: tagged ? realHeight : 8,
        height_tagged: tagged,
        ...(fp.tag === "ms-ml" && Number(fp.properties?.confidence) >= 0
          ? { ml_confidence: Number(fp.properties.confidence) }
          : {}),
        source: fp.tag,
        confidence: "unmatched",
        center: c,
      },
    });
  });

  // Compact JSON — 279-feature output ships to every /map and /3d load;
  // pretty-printing nearly doubled the transfer size for no benefit.
  writeFileSync(OUT_GEOJSON, JSON.stringify({ type: "FeatureCollection", features }));
  console.log(`Wrote ${OUT_GEOJSON}: ${features.length} polygons (${matched} matched, ${features.length - matched - unnamed} boxes, ${unnamed} unnamed).`);

  const sources = {
    generated: new Date().toISOString(),
    bbox: [BBOX_MIN_LNG, BBOX_MIN_LAT, BBOX_MAX_LNG, BBOX_MAX_LAT],
    footprint_sources: usedSources,
    inputs: ["src/data/campus-buildings.json", "src/data/building-room-join.ts"].concat(usedSources),
    attribution: [
      { dataset: "Google Open Buildings v3", license: "CC-BY 4.0", url: "https://sites.research.google/open-buildings/", used: usedSources.some((s) => s.includes("open-buildings")) },
      { dataset: "OpenStreetMap buildings", license: "ODbL", url: "https://www.openstreetmap.org/copyright", used: usedSources.some((s) => s.includes("OSM")) },
      { dataset: "Microsoft GlobalMLBuildingFootprints", license: "CDLA-Permissive-2.0", url: "https://github.com/microsoft/GlobalMLBuildingFootprints", used: usedSources.includes("Microsoft GlobalMLBuildingFootprints") },
      { dataset: "Availlo hand pins", license: "proprietary", used: true },
    ],
    notes: "Heights are ML estimates (ms-ml height_m) or category estimates, not surveyed. Do not use for navigation or construction.",
  };
  writeFileSync(OUT_SOURCES, JSON.stringify(sources, null, 2));
  console.log(`Wrote ${OUT_SOURCES}`);
}

main();
