/**
 * Mapbox client bootstrap.
 *
 * Centralizes the access token and the active style URL so the rest of the
 * app only ever imports from here. The style URL is read from
 * VITE_MAPBOX_STYLE (see .env.example for alternatives); the access token
 * from VITE_MAPBOX_TOKEN.
 *
 * IMPORTANT: only put a public (pk.*) token in .env. Secret (sk.*) tokens
 * have scopes (e.g. tilesets:read) that cannot be granted to public tokens
 * and are not needed by the browser app. If you ever need write access to
 * styles/tilesets/datasets, do it server-side with a separate sk.* token.
 */

import mapboxgl from "mapbox-gl"

const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
const style =
  (import.meta.env.VITE_MAPBOX_STYLE as string | undefined) ||
  "mapbox://styles/mapbox/streets-v12"

if (!token) {
  // Don't crash the app at import time — the CampusMap component will show
  // a helpful empty state. But warn loudly so this gets noticed in dev.
  console.warn(
    "[mapbox] VITE_MAPBOX_TOKEN is not set. The /map page will show a setup notice. " +
      "Add a public pk.* token to .env — see .env.example for details.",
  )
}

mapboxgl.accessToken = token ?? ""

// Disable Mapbox anonymous-usage telemetry (events.mapbox.com). It serves
// no app purpose and its requests are blocked by common ad-blockers /
// tracking prevention, which surfaces as CORS console noise.
;(mapboxgl.config as unknown as { EVENTS_URL?: string | null }).EVENTS_URL =
  null

export const MAPBOX_STYLE = style

/**
 * Approximate bounds of the University of Uyo main campus. Used to
 * fitBounds on the map so the user always lands on the right area
 * regardless of how the map is opened (deep link, refresh, etc.).
 *
 * Format: [[swLng, swLat], [neLng, neLat]] — GeoJSON LngLatBounds.
 */
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [7.967, 5.025],
  [7.99, 5.05],
]

/**
 * Campus center (lng, lat). Used as the initial center before fitBounds
 * resolves. Also used for the "Recenter" control.
 */
export const CAMPUS_CENTER: [number, number] = [7.977964, 5.037636]

export { mapboxgl }
