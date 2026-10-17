/**
 * osm-to-footprints.mjs
 *
 * Converts an Overpass JSON export of campus buildings into the Polygon
 * FeatureCollection that build-campus-polygons.mjs consumes.
 *
 * Why: Overpass reachability from any single sandbox/machine is flaky.
 * From your own connection it's one 30-second, ~1 MB request — tiny.
 *
 * Usage:
 *   1. Fetch (or open the URL in a browser and save):
 *      curl -s 'https://overpass-api.de/api/interpreter' \
 *        --data-urlencode 'data=[out:json][timeout:25];(way["building"](5.034,7.968,5.050,7.988););out geom tags;' \
 *        -o osm-buildings.json
 *   2. node scripts/osm-to-footprints.mjs osm-buildings.json
 *   → writes public/data/raw-osm-buildings.geojson
 *   3. bun run build:polygons
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public/data/raw-osm-buildings.geojson");

const input = process.argv[2]
  ? resolve(process.argv[2])
  : join(root, "osm-buildings.json");
const raw = JSON.parse(readFileSync(input, "utf8"));

const features = [];
for (const el of raw.elements ?? []) {
  if (el.type !== "way" || !el.geometry || el.geometry.length < 4) continue;
  // Overpass returns ordered node geometry for ways; overpass-api.de may
  // expose {lat, lon} or {lat, lng}.
  const ring = el.geometry
    .map((p) => [p.lon ?? p.lng ?? p.lnglat?.[0], p.lat ?? p.lnglat?.[1]])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
  if (ring.length < 4) continue;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);

  const tags = el.tags ?? {};
  const props = {
    name: tags.name ?? null,
    building: tags.building ?? "yes",
    source: "osm",
    osm_id: el.id,
  };
  // Real heights from OSM when mappers added them (build:height, height,
  // or building:levels × 3.2m assumption).
  const h = Number(tags.height ?? tags["building:height"]);
  if (Number.isFinite(h) && h > 0) props.height_m = h;
  const levels = Number(tags["building:levels"]);
  if (!Number.isFinite(props.height_m) && Number.isFinite(levels) && levels > 0) {
    props.height_m = levels * 3.2;
  }

  features.push({
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: props,
  });
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ type: "FeatureCollection", features }, null, 2),
);
console.log(`Converted ${features.length} OSM building polygons → ${OUT}`);
console.log("Next: bun run build:polygons");
