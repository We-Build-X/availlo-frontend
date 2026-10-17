/**
 * fetch-open-buildings.mjs
 *
 * Streams Google Open Buildings v3 for the S2 level-4 cell that contains
 * the UNIUYO campus campus bbox, filters to the campus bbox, and writes
 * Polygon features to `public/data/raw-open-buildings.geojson`.
 *
 * The cell file is ~2.5 GB (gzipped). We stream row-by-row so memory
 * stays flat and we only keep what's inside the campus bbox (~hundreds
 * of buildings → a few hundred KB out).
 *
 * Run ON A MACHINE WITH NETWORK (this needs ~2.5 GB of bandwidth, 10-30+
 * min):  bun run fetch:buildings
 *
 * Then re-run:  bun run build:polygons
 * (spatial-join script picks this file up automatically)
 *
 * Schema (v3 polygons CSV):
 *   latitude_longitude, area_in_meters, confidence, geometry, full_plus_code
 *   geometry = WKT "POLYGON ((lng lat, ...))" or MULTIPOLYGON.
 *
 * Attribution: Google Open Buildings v3 (CC-BY 4.0), see scene-sources.json.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public/data/raw-open-buildings.geojson");

// Campus bbox — [minLng, minLat, maxLng, maxLat] with small margin.
// Keep in sync with src/integrations/mapbox/client.ts CAMPUS_BOUNDS.
const BBOX = { minLng: 7.968, minLat: 5.034, maxLng: 7.988, maxLat: 5.050 };

// S2 level-4 cell file for Uyo (computed via s2-geometry; see README).
const CELL_TOKEN = "105";
const URL_ = `https://storage.googleapis.com/download/storage/v1/b/open-buildings-data/o/v3%2Fpolygons_s2_level_4_gzip%2F${CELL_TOKEN}_buildings.csv.gz?alt=media`;

const inBbox = (lng, lat) =>
  lng >= BBOX.minLng && lng <= BBOX.maxLng && lat >= BBOX.minLat && lat <= BBOX.maxLat;

function parseWktPoint(wkt) {
  const m = wkt.match(/POINT Z?\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
}

function wktToGeoGeometry(wkt) {
  // POLYGON ((...)) or MULTIPOLYGON (((...), (...)))
  if (wkt.startsWith("POLYGON")) {
    return wkt.replace("POLYGON", "").replace(/Z$/, "").trim();
  }
  return null;
}

function ringFromWktBlock(block) {
  return block
    .trim()
    .replace(/^\(\(|\)\)$/g, "")
    .split("),(")
    .map((seg) =>
      seg
        .replace(/[()]/g, " ")
        .trim()
        .split(",")
        .map((pair) => {
          const [lng, lat] = pair.trim().split(/\s+/).map(Number);
          return [lng, lat];
        }),
    );
}

// Minimal WKT polygon parser for v3's single-ring/multi-ring output.
function parsePolygonWkt(wkt) {
  const rings = [];
  const ringMatches = wkt.matchAll(/\((\(.*?\))\)/g);
  for (const m of ringMatches) {
    const ring = m[1]
      .split(",")
      .map((pair) => {
        const [lng, lat] = pair.trim().split(/\s+/).map(Number);
        return [lng, lat];
      });
    if (ring.length >= 4) rings.push(ring);
  }
  return rings.length > 0 ? rings : null;
}

async function main() {
  console.log(`Fetching Open Buildings v3 cell ${CELL_TOKEN} (≈2.5 GB) …`);
  console.log("This streams and filters in-flight — only campus builds are kept.");

  let bytesRead = 0;
  let kept = 0;
  let lastReport = 0;
  const features = [];

  let buf = "";
  const filter = new Transform({
    transform(chunk, _enc, cb) {
      bytesRead += chunk.length;
      if (bytesRead - lastReport > 200 * 1024 * 1024) {
        console.log(`  ${(bytesRead / 1024 / 1024 / 1024).toFixed(2)} GB read, ${kept} kept …`);
        lastReport = bytesRead;
      }
      buf += chunk.toString("utf8");
      let idx;
      // CSV rows end with \n inside quoted WKT? v3 geometry has no embedded
      // newlines, so split on newline safely.
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line || line.startsWith("latitude_longitude")) continue;
        // CSV columns: latitude_longitude point WKT, area, confidence, geometry, plus_code
        // Geometry may contain commas, so split from the right on top-level
        // fields using a targeted pattern instead of naive split(",").
        const geomIdx = line.indexOf("POLYGON");
        if (geomIdx === -1) continue;
        const latlngPart = line.slice(0, line.indexOf("POINT"));
        const pt = parseWktPoint(latlngPart);
        if (!pt || !inBbox(pt[0], pt[1])) continue;
        const wktEnd = line.lastIndexOf(")");
        const wkt = line.slice(geomIdx, wktEnd + 1);
        const areaMatch = line.slice(0, geomIdx).match(/,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*$/);
        const area = areaMatch ? Number(areaMatch[1]) : 0;
        const confidence = areaMatch ? Number(areaMatch[2]) : 0.5;
        const rings = parsePolygonWkt(wkt);
        if (!rings) continue;
        kept++;
        features.push({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: rings },
          properties: { area_m2: area, confidence, center: pt, source: "open-buildings-v3" },
        });
      }
      cb(null, chunk);
    },
  });

  const res = await fetch(URL_);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createGunzip(), filter);

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify({ type: "FeatureCollection", features }, null, 2),
  );
  console.log(`Done. ${(bytesRead / 1024 / 1024 / 1024).toFixed(2)} GB streamed.`);
  console.log(`Kept ${features.length} campus buildings → ${OUT}`);
  console.log("Next: bun run build:polygons");
}

main().catch((err) => {
  console.error("fetch failed:", err.message);
  process.exit(1);
});
