# `campus-buildings.json`

**Source:** Mapbox Dataset `shakzy/clly08aik5fwf2as9kzxvxjgm`, fetched `2026-08-28` via the public Mapbox Datasets API using shakzy's public access token.

**Endpoint used (one-time, manual):**

```
GET https://api.mapbox.com/datasets/v1/shakzy/clly08aik5fwf2as9kzxvxjgm/features
    ?access_token=pk.eyJ1Ijoic2hha3p5IiwiYSI6ImNsbHh3bmpkNDJrN3czcHA4eWlsbGo5cXgifQ.dI63IIgQ30AaQrmQLwBsaA
```

## What this is

A GeoJSON `FeatureCollection` of **24 points**. Each feature represents a building / venue on the **University of Uyo main campus**. Each feature has:

| Field | Meaning |
|---|---|
| `feature.properties.title` | Building name (e.g. "New Engineering Classroom Block") |
| `feature.properties.description` | Short blurb about the building |
| `feature.geometry.coordinates` | `[lng, lat]` — used to place the marker on the Mapbox map |
| `feature.id` | Stable hash from the original dataset (not human-readable, kept for Mapbox feature-state tracking) |

## How the data flows

```
campus-buildings.json  (committed, build-time)
        │
        │  imported by the React app (Vite ?url)
        ▼
CampusMap.tsx  ──►  map.addSource('buildings', { type: 'geojson', data })
        │
        │  Mapbox GL renders the `buildings` source as a circle layer
        │  styled by building status (FREE / ENDING_SOON / OCCUPIED)
        ▼
BuildingPopup.tsx  ──►  reads feature.properties.title, .description,
                          joins with /api/rooms/ to list rooms inside.
```

## Coordinate system

- **GeoJSON spec:** `[longitude, latitude]` (lng first, lat second).
- **WGS84** (standard GPS).
- **Approximate campus centre:** `[7.977964, 5.037636]` (the original "Entry point" feature).

## Caveats

1. **Points, not polygons.** The reference Mapbox style from shakzy used OSM-derived building footprints from the Mapbox `mapbox-streets-v8` vector tiles. The GeoJSON here only has the **marker positions** for the 24 main buildings, not their outline shapes. For Availlo v1 we use the building footprints that come for free with the stock Mapbox `streets-v12` style. To get more accurate building outlines, query OpenStreetMap's building=* layer for the campus in a follow-up.
2. **Coordinates are hand-placed.** They came from the original author's manual placement in Mapbox Studio. For a production app you should:
   - cross-check against a satellite image, or
   - walk the campus with a phone GPS and average readings, or
   - use the official campus blueprint.
3. **No `category`, no `image`, no `status`.** The dataset is just `title` + `description`. Anything else (image URL, faculty, opening status) is added at runtime:
   - **Image:** `BuildingPopup.tsx` falls back to `/NECB.jpeg` for buildings without a dedicated photo. To add per-building images, add an `image` property to the feature in this file.
   - **Status:** computed by `useBuildingStatus.ts` from `/api/rooms/` and applied via `map.setFeatureState`.
4. **Duplicates with `uniuyo-coordinates.json` in the repo root.** Both files describe similar buildings but with different (and often more accurate) coordinates. The Availlo app currently imports *both*; only the Mapbox map needs the GeoJSON. Long term, the local `uniuyo-coordinates.json` is the better source (geocoded from Google Maps URLs, broader coverage, owned by us) and this file should eventually be regenerated from it.

## Adding or editing a building

Open this file and edit the JSON directly. Format:

```json
{
  "type": "Feature",
  "properties": {
    "title": "New Engineering Classroom Block",
    "description": "The New Engineering Classroom Block, commissioned in 2014…"
  },
  "geometry": { "type": "Point", "coordinates": [7.976075, 5.039019] },
  "id": "00a7b3ca40de2efb31eea14fd700cfd0"
}
```

Optional `properties` keys the React app will pick up if present:

- `image` — path under `public/`, e.g. `"/buildings/necb.jpg"`
- `category` — `"engineering" | "science" | "arts" | "agriculture" | "admin" | "hostel" | "other"`
- `faculty` — same values as the `Venue.faculty` enum in `src/lib/mock-data.ts`

## Re-fetching

If you ever want to refresh the list (e.g. shakzy added more buildings), re-run the curl above and overwrite this file. **Do not** use this data as the source of truth for production coordinates.
