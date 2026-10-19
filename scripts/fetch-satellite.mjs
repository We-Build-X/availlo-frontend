/**
 * fetch-satellite.mjs
 *
 * Build-time imagery for the /3d viewer via the Mapbox Static Images API
 * (style: satellite):
 *
 *  1. public/terrain/campus-sat.jpg  — the whole campus bbox (+ ~470 m
 *     fringe) at ~1 m/px: real roads, grass, paths, tree shadows. Used
 *     as the viewer's ground texture.
 *  2. public/terrain/roof-{slug}.jpg — one 400×400@2x crop per NAMED
 *     venue, tightly covering its footprint bbox. Used as that
 *     building's ROOF texture: real roof lines/colors/shadows instead
 *     of painted color.
 *  3. public/terrain/index.json — { ground: bbox, roofs: { slug: bbox }}
 *     so the scene can place planes and map UVs exactly.
 *
 * Every image is cached: re-running skips files that already exist,
 * so only new venues cost API calls. pk (public) token read from .env.
 *
 * Run: `bun run fetch:satellite`
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const OUT_DIR = join(root, "public/terrain");
const POLYGONS = join(root, "public/data/campus-polygons.geojson");

// Fringe around the campus so the ground image continues past the
// outermost buildings instead of ending on a hard rectangle.
const GROUND_PAD = 0.0045; // ~500 m

function readToken() {
  const env = readFileSync(join(root, ".env"), "utf8");
  const m = env.match(/^VITE_MAPBOX_TOKEN=pk\.\S+$/m);
  if (!m) {
    console.error("VITE_MAPBOX_TOKEN (pk.*) not found in .env");
    process.exit(1);
  }
  return m[0].split("=")[1].trim();
}

async function fetchImage(url, dest) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) throw new Error("suspiciously tiny image");
      writeFileSync(dest, buf);
      return true;
    } catch (err) {
      console.warn(`  attempt ${attempt} failed (${err.message})`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return false;
}

async function main() {
  const token = readToken();
  const { mkdirSync } = await import("node:fs");
  mkdirSync(OUT_DIR, { recursive: true });

  const geo = JSON.parse(readFileSync(POLYGONS, "utf8"));
  const named = geo.features.filter(
    (f) => f.properties.named && f.properties.source !== "hand-box",
  );

  const manifest = { generated: new Date().toISOString(), ground: null, roofs: {} };

  // ---- 1. campus ground ----
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const f of geo.features) {
    if (f.geometry?.type !== "Polygon") continue;
    for (const [lng, lat] of f.geometry.coordinates[0]) {
      minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    }
  }
  const g = [
    minLng - GROUND_PAD, minLat - GROUND_PAD,
    maxLng + GROUND_PAD, maxLat + GROUND_PAD,
  ];
  manifest.ground = { bbox: g };
  const groundDest = join(OUT_DIR, "campus-sat.jpg");
  if (existsSync(groundDest)) {
    console.log("campus-sat.jpg cached — skipping");
  } else {
    const url = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/[${g.join(",")}]/1280x1280@2x?access_token=${token}&logo=false&attribution=false`;
    console.log("Fetching campus ground image…");
    if (await fetchImage(url, groundDest)) console.log("  ✓ campus-sat.jpg");
    else console.error("  ✗ ground image failed (script will need re-run)");
  }

  // ---- 2. per-venue roofs ----
  let done = 0, cached = 0, failed = 0;
  for (const f of named) {
    const slug = f.properties.slug;
    const ring = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
    let bMinLng = Infinity, bMaxLng = -Infinity, bMinLat = Infinity, bMaxLat = -Infinity;
    for (const [lng, lat] of ring) {
      bMinLng = Math.min(bMinLng, lng); bMaxLng = Math.max(bMaxLng, lng);
      bMinLat = Math.min(bMinLat, lat); bMaxLat = Math.max(bMaxLat, lat);
    }
    // 3 m margin so the roof texture bleeds a hair past the walls.
    const b = [bMinLng - 3e-5, bMinLat - 3e-5, bMaxLng + 3e-5, bMaxLat + 3e-5];
    manifest.roofs[slug] = { bbox: b };
    const dest = join(OUT_DIR, `roof-${slug}.jpg`);
    if (existsSync(dest)) { cached++; continue; }
    const url = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/[${b.join(",")}]/400x400@2x?access_token=${token}&logo=false&attribution=false`;
    if (await fetchImage(url, dest)) { done++; }
    else { failed++; console.error(`  ✗ roof ${slug}`); }
  }
  console.log(`roofs: ${done} fetched, ${cached} cached, ${failed} failed (of ${named.length})`);

  writeFileSync(join(OUT_DIR, "index.json"), JSON.stringify(manifest, null, 2));
  console.log("Wrote public/terrain/index.json");
}

main().catch((err) => {
  console.error("fetch-satellite failed:", err);
  process.exit(1);
});
