require('dotenv').config();
const https = require('https');
const fs = require('fs');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const buildings = [
  // Engineering
  { name: "NEB — New Engineering Block",                              url: "https://maps.app.goo.gl/BxXdpM1bc3hdMgtn9" },
  { name: "NECB — New Engineering Class Block",                       url: "https://maps.app.goo.gl/Rv1BfsZtRc5KuJFg8" },
  { name: "ELT — Engineering Lecture Theatre (Link 1)",               url: "https://maps.app.goo.gl/Mn9h2jNxMRPSQ4WG6" },
  { name: "ELT — Engineering Lecture Theatre (Link 2)",               url: "https://maps.app.goo.gl/qoihQyH62eJKPb9h8" },
  { name: "ELF Lecture Hall",                                         url: "https://maps.app.goo.gl/cFcvqfBv2Agh6W9b9" },
  { name: "PTDF",                                                     url: "https://maps.app.goo.gl/F5jDUc5PdwQ6fARG7" },
  { name: "Faculty of Engineering (Main)",                            url: "https://maps.app.goo.gl/9ydWGyDodTX4kPov7" },
  { name: "Agric Engineering Laboratory Block",                       url: "https://maps.app.goo.gl/7u5Hj3wfXxePbq8f6" },
  { name: "Zinox Computer Lab",                                       url: "https://maps.app.goo.gl/uUEJ5ZpKm5w9ZnVs5" },
  { name: "Engineering Market",                                       url: "https://goo.gl/maps/f4BqQFSwiws62jnD9?g_st=aw" },

  // Science
  { name: "Faculty of Science",                                       url: "https://maps.app.goo.gl/61UMWRnWWFg3WuGA8" },
  { name: "Science Lecture Theatre",                                  url: "https://maps.app.goo.gl/4BpyEGX984rDwdod9" },
  { name: "Geoscience",                                               url: "https://maps.app.goo.gl/RUVEbMwpL5CyRsAU8" },
  { name: "Department of Computer Science, Statistics & Mathematics", url: "https://maps.app.goo.gl/o8VecEwAfSN1F4k58" },

  // Agriculture
  { name: "Faculty of Agriculture",                                   url: "https://maps.app.goo.gl/1FFRsdF7MJbMAn9U8" },
  { name: "ALT — Agric Lecture Theatre (600 cap)",                    url: "https://maps.app.goo.gl/CM91qpjYScfiL9V57" },
  { name: "Agric Class Block",                                        url: "https://maps.app.goo.gl/RHnRyZsB91Hoa6AB8" },

  // Arts
  { name: "Faculty of Arts, Block 1",                                 url: "https://goo.gl/maps/pshPfpJqKs1ie5Nk7?g_st=aw" },
  { name: "Faculty of Arts, Block 2",                                 url: "https://goo.gl/maps/Q2SLmf3bpJq17rWF9?g_st=aw" },
  { name: "Professor Stella Idiong Art Gallery",                      url: "https://maps.app.goo.gl/mLJ9Xv75yJd15uy69" },
  { name: "Department of Theatre Arts and Film Studio",               url: "https://goo.gl/maps/16bz2jbgtNdLL5eJ7?g_st=aw" },
  { name: "Department of Fine and Industrial Arts",                   url: "https://maps.app.goo.gl/aB5JaPiYX4MVLrzW7" },

  // Law
  { name: "Faculty of Law",                                           url: "https://maps.app.goo.gl/svVAohSKg1d8ZnkaA" },

  // Environmental Science
  { name: "Faculty of Environmental Science",                         url: "https://maps.app.goo.gl/cKYoRQfpwHupjfSL6" },

  // General
  { name: "1000 Capacity Building",                                   url: "https://maps.app.goo.gl/CEd8yhC2zewqMR27A" },
  { name: "Multipurpose Hall",                                        url: "https://maps.app.goo.gl/o5UGb1VrYbXBzYKe7" },
  { name: "Convocation Arena",                                        url: "https://maps.app.goo.gl/iN6p6fTk4WeuyVfe7" },
  { name: "Admin Block",                                              url: "https://maps.app.goo.gl/mC1xzkScqKHwhojFA" },
  { name: "Postgraduate School",                                      url: "https://maps.app.goo.gl/WrUg4E5WxcQUNDAi7" },
  { name: "Uniuyo Library",                                           url: "https://maps.app.goo.gl/SZY2sPgoKXzieQdY6" },
  { name: "Health Center",                                            url: "https://maps.app.goo.gl/ZSizd4CHuWQjuve37?g_st=aw" },
  { name: "ICT 2 UniUyo",                                             url: "https://maps.app.goo.gl/YxpQBGfoZSLEZ5i76" },
  { name: "Window to America",                                        url: "https://maps.app.goo.gl/4ofqrznaoPBuSVe49" },
  { name: "Microfinance Bank",                                        url: "https://maps.app.goo.gl/hNH2KUMM7SMLbZ7f8?g_st=aw" },
  { name: "Science Market",                                           url: "https://maps.app.goo.gl/rw3UVonvPBbj3hWr7?g_st=aw" },
  { name: "5 Arms",                                                   url: "https://maps.app.goo.gl/YN4Bo7zj2gut9r8G9" },
  { name: "Uniuyo Table Water",                                       url: "https://maps.app.goo.gl/a8pM491xReFkzuih6?g_st=aw" },

  // Hostels
  { name: "Female Presidential Hostel",                               url: "https://maps.app.goo.gl/iGLXyBvzNANSSCn78" },
  { name: "Male Presidential Hostel",                                 url: "https://maps.app.goo.gl/FxJB3tPR74RgJs9J6" },
  { name: "NDDC Hostel — Ultra Modern (Male & Female)",               url: "https://maps.app.goo.gl/zsRJ2bCU4DX8hoDv8" },
];

// ─── helpers ────────────────────────────────────────────────────────────────

function followRedirect(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    };

    const makeRequest = (currentUrl, hops = 0) => {
      if (hops > 8) return resolve(null);

      const mod = currentUrl.startsWith('https') ? https : require('http');
      const req = mod.get(currentUrl, options, (res) => {
        const location = res.headers['location'];
        if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && location) {
          const next = location.startsWith('http') ? location : new URL(location, currentUrl).href;
          makeRequest(next, hops + 1);
        } else {
          resolve(currentUrl);
        }
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    };

    makeRequest(url);
  });
}

function extractCoordsFromUrl(url) {
  if (!url) return null;
  // Pattern: @lat,lng or @lat,lng,zoom or !3d<lat>!4d<lng>
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  const dMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch) return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };

  return null;
}

// Add this helper above the geocode function
function cleanName(name) {
  // Remove abbreviation prefix like "NEB — " before geocoding
  return name.replace(/^[A-Z\s]+—\s*/, '').trim();
}

// Replace your geocode function with this
function geocode(name) {
  return new Promise((resolve) => {
    if (!API_KEY) return resolve(null);

    const clean = cleanName(name);
    const query = encodeURIComponent(`${clean}, University of Uyo, Uyo, Akwa Ibom, Nigeria`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${API_KEY}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'OK' && json.results.length > 0) {
            const loc = json.results[0].geometry.location;
            resolve({ lat: loc.lat, lng: loc.lng, source: 'geocode' });
          } else {
            // Print the actual error so we can see what's wrong
            console.log(`\n  Geocode status: ${json.status} — ${json.error_message ?? 'no message'}`);
            resolve(null);
          }
        } catch (e) {
          console.log(`\n  Geocode parse error: ${e.message}`);
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.log(`\n  Geocode request error: ${e.message}`);
      resolve(null);
    });
  });
}
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── main ───────────────────────────────────────────────────────────────────

async function run() {
  if (!API_KEY) {
    console.warn('Warning: GOOGLE_MAPS_API_KEY not set in .env — will only try redirect method.\n');
  }

  const results = [];

  for (const building of buildings) {
    process.stdout.write(`Processing: ${building.name} ... `);

    // Option A — follow redirect and parse URL
    const finalUrl = await followRedirect(building.url);
    let coords = extractCoordsFromUrl(finalUrl);
    let source = 'redirect';

    // Option C fallback — Geocoding API
    if (!coords) {
      process.stdout.write('redirect failed, trying geocode ... ');
      const geo = await geocode(building.name);
      if (geo) {
        coords = geo;
        source = 'geocode';
      }
    }

    if (coords) {
      console.log(`✓  ${coords.lat}, ${coords.lng}  [${source}]`);
    } else {
      console.log('✗  could not resolve');
    }

    results.push({
      name: building.name,
      mapsUrl: building.url,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      source: coords ? source : 'failed',
    });

    await sleep(300); // be polite to Google
  }

  // ── output as JSON ──────────────────────────────────────────────────────
  fs.writeFileSync(
    'uniuyo-coordinates.json',
    JSON.stringify(results, null, 2)
  );

  // ── output as CSV (easy to paste into a seed file) ──────────────────────
  const csv = [
    'name,lat,lng,maps_url,source',
    ...results.map(r =>
      `"${r.name}",${r.lat ?? ''},${r.lng ?? ''},"${r.mapsUrl}","${r.source}"`
    )
  ].join('\n');
  fs.writeFileSync('uniuyo-coordinates.csv', csv);

  const failed = results.filter(r => r.source === 'failed');
  console.log(`\nDone. ${results.length - failed.length}/${results.length} resolved.`);
  if (failed.length > 0) {
    console.log('Failed to resolve:');
    failed.forEach(f => console.log(`  - ${f.name}`));
  }
  console.log('\nOutput files:');
  console.log('  uniuyo-coordinates.json');
  console.log('  uniuyo-coordinates.csv');
}

run();
