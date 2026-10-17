/**
 * fetch-ms-footprints.mjs
 *
 * Downloads the Microsoft Global ML Building Footprints tile(s) covering
 * the UNIUYO campus and writes the bbox-filtered features to
 * `public/data/raw-ms-buildings.geojson`.
 *
 * Why Microsoft ML: Nigeria is quadkey-partitioned at LOD 9 and the whole
 * campus is ONE tile (~27 MB zipped, streamed here as line-delimited
 * GeoJSON) — versus Google Open Buildings Path B at 2.55 GB. Frees the
 * "no real footprint anywhere" venues (NEB, NECB, Fac. of Science,
 * Fac. of Computing, 5 ARMS, ICT II, Main Library, Geoscience, ...) from
 * placeholder-box limbo: ML polygons ARE real detected geometry.
 *
 * Data: Microsoft GlobalMLBuildingFootprints 2026-08-13 refresh,
 * CDLA-Permissive-2.0 ( https://github.com/microsoft/GlobalMLBuildingFootprints ).
 *
 * Run: `bun run fetch:ms` (writes raw-ms-buildings.geojson, then rerun
 * `bun run build:polygons` to rejoin pins against OSM-first + ML-second).
 */

import {
  createWriteStream,
  createReadStream,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createGunzip } from "node:zlib";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const OUT = join(root, "public/data/raw-ms-buildings.geojson");
const LINKS_CSV = "/tmp/opencode/dataset-links.csv";

// Campus extents (same as build-campus-polygons.mjs).
const BBOX_MIN_LNG = 7.968;
const BBOX_MIN_LAT = 5.034;
const BBOX_MAX_LNG = 7.987;
const BBOX_MAX_LAT = 5.052;

/** Bing tile quadkey at zoom 9 (dataset LOD). */
function quadkeyAtZoom(lng, lat, z) {
  const x = Math.floor(((lng + 180) / 360) * 2 ** z);
  const y = Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
      2) *
      2 ** z,
  );
  let q = "";
  for (let i = z; i > 0; i--) {
    let digit = 0;
    const mask = 1 << (i - 1);
    if (x & mask) digit += 1;
    if (y & mask) digit += 2;
    q += digit;
  }
  return q;
}

const Z9 = quadkeyAtZoom(
  (BBOX_MIN_LNG + BBOX_MAX_LNG) / 2,
  (BBOX_MIN_LAT + BBOX_MAX_LAT) / 2,
  9,
);

async function main() {
  // `--from <path>` parses a pre-downloaded .csv.gz (network here is
  // flaky; curl handles retries better than fetch).
  const fromIdx = process.argv.indexOf("--from");
  const fromPath = fromIdx >= 0 ? process.argv[fromIdx + 1] : null;

  let stream;
  if (fromPath) {
    console.log(`Parsing pre-downloaded file: ${fromPath}`);
    stream = createReadStream(fromPath).pipe(createGunzip());
  } else {
    if (!existsSync(LINKS_CSV)) {
      console.error(
        `dataset-links.csv not found at ${LINKS_CSV} — re-download it:\ncurl -sL "https://bfppub.blob.core.windows.net/%24web/2026-08-13/dataset-links.csv" -o ${LINKS_CSV}`,
      );
      process.exit(1);
    }

    const rows = readFileSync(LINKS_CSV, "utf8")
      .split("\n")
      .slice(1)
      .filter(Boolean)
      .map((line) => line.split(","));
    const tileRow = rows.find((r) => r[1] === Z9);
    if (!tileRow) {
      console.error(
        `QuadKey ${Z9} not in dataset-links.csv — campus outside coverage?`,
      );
      process.exit(1);
    }
    const [, , url, sizeLabel] = tileRow;
    console.log(`Tile ${Z9} (${sizeLabel}): ${url}`);

    const res = await fetch(url);
    if (!res.ok || !res.body) {
      console.error(`HTTP ${res.status} fetching tile`);
      process.exit(1);
    }
    stream = res.body.pipe(createGunzip());
  }
  const rl = readline.createInterface(stream);

  const features = [];
  let scanned = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    scanned++;
    let f;
    try {
      f = JSON.parse(line);
    } catch {
      continue;
    }
    const g = f?.geometry;
    if (!g || g.type !== "Polygon") continue;
    const ring = g.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) continue;
    // Bbox filter from the ring bounds (rings are tiny; no winding math needed).
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of ring) {
      minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    }
    if (maxLng < BBOX_MIN_LNG || minLng > BBOX_MAX_LNG) continue;
    if (maxLat < BBOX_MIN_LAT || minLat > BBOX_MAX_LAT) continue;

    const props = f.properties ?? {};
    features.push({
      type: "Feature",
      geometry: g,
      properties: {
        source: "ms-ml",
        height_m: Number(props.height) > 0 ? Number(props.height) : null,
        confidence: Number(props.confidence) >= 0 ? Number(props.confidence) : null,
      },
    });
  }
  console.log(`Scanned ${scanned} lines -> kept ${features.length} features in bbox.`);

  writeFileSync(
    OUT,
    JSON.stringify({ type: "FeatureCollection", features }, null, 2),
  );
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error("fetch-ms-footprints failed:", err);
  process.exit(1);
});
