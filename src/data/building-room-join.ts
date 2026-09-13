/**
 * Manual join table between the campus buildings GeoJSON and the room
 * records served by the Availlo backend at /api/rooms/.
 *
 * Why this exists:
 *   The GeoJSON gives us one marker per BUILDING (24 of them).
 *   The backend gives us one record per ROOM (a Venue is a room, not a
 *   building). When a user clicks a marker on the map we want to show
 *   them the rooms inside that building, with per-room availability.
 *
 *   This file is the bridge. For each building, we list the room ids
 *   that belong to it. Initially the rooms array is empty because the
 *   Availlo backend is not yet serving room data — the map still works
 *   without rooms, the popup just shows the building info only.
 *
 * How to fill it in:
 *   1. Start the backend, hit GET /api/rooms/ to see the response shape.
 *   2. Each Room has a `building.code` (e.g. "NECB") and a `building.name`
 *      (e.g. "New Engineering Classroom Block"). Match the `name` to
 *      one of the `campusBuildings[].title` values below.
 *   3. Drop the room ids into the `rooms` array.
 *   4. (Optional) Once the table is fully populated, regenerate it
 *      from the live /api/rooms/ response with a one-off script.
 *
 * Format: keyed by the GeoJSON `title` (exact match). Do not edit the
 * keys — they are the source of truth for the join.
 */

export interface BuildingRoomJoin {
  /** Stable slug used as the Mapbox feature id (and for the URL). */
  slug: string
  /** Short code, e.g. "NECB". */
  code: string
  /** Faculty the building belongs to. */
  faculty:
    | "Engineering"
    | "Science"
    | "Arts"
    | "Agriculture"
    | "Administration"
    | "Other"
  /** Room ids (matching the backend Room.id) that live inside this building. */
  rooms: number[]
}

/** Slugified id of a GeoJSON title. */
export const slugify = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[—–]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

/**
 * Initial join table. Keys are the exact `feature.properties.title` values
 * in `campus-buildings.geojson`. Slugs are derived (and frozen here) so
 * we have a stable identifier to use in URLs and feature-state tracking.
 *
 * Marked as Partial so that consumers must handle the "no join entry
 * for this building" case gracefully — the runtime reality is that
 * some buildings in the GeoJSON may not have a hand-maintained entry.
 *
 * TODO(backend): populate the `rooms: number[]` arrays once the backend
 * is wired up and serving /api/rooms/.
 */
export const BUILDING_TO_ROOMS: Partial<Record<string, BuildingRoomJoin>> = {
  "New Engineering Classroom Block": {
    slug: "necb",
    code: "NECB",
    faculty: "Engineering",
    rooms: [],
  },
  "UNIUYO-Magvoile Center for Skills Acquisition": {
    slug: "magvoile-center",
    code: "MAG",
    faculty: "Other",
    rooms: [],
  },
  "Science Lecture Theatre (1k Cap)": {
    slug: "science-lecture-theatre",
    code: "SLT",
    faculty: "Science",
    rooms: [],
  },
  "Zinox Laboratories": {
    slug: "zinox-labs",
    code: "ZNL",
    faculty: "Engineering",
    rooms: [],
  },
  "Engine Market": {
    slug: "engine-market",
    code: "EMKT",
    faculty: "Other",
    rooms: [],
  },
  "Bus Stop (Engineering)": {
    slug: "bus-stop-engineering",
    code: "BUS",
    faculty: "Other",
    rooms: [],
  },
  "Male Presidential Hostel": {
    slug: "male-presidential-hostel",
    code: "MPH",
    faculty: "Other",
    rooms: [],
  },
  "Engineering Lecture Theater": {
    slug: "engineering-lecture-theater",
    code: "ELT",
    faculty: "Engineering",
    rooms: [],
  },
  "The Prestigious Faculty of Science": {
    slug: "faculty-of-science",
    code: "FSC",
    faculty: "Science",
    rooms: [],
  },
  "University of Uyo, Main Campus Library": {
    slug: "main-library",
    code: "LIB",
    faculty: "Administration",
    rooms: [],
  },
  "Y-Building": {
    slug: "y-building",
    code: "YBLD",
    faculty: "Other",
    rooms: [],
  },
  "Engineering Laboratories": {
    slug: "engineering-labs",
    code: "ELB",
    faculty: "Engineering",
    rooms: [],
  },
  "Agric Lecture Theater": {
    slug: "agric-lecture-theater",
    code: "ALT",
    faculty: "Agriculture",
    rooms: [],
  },
  "Engineering Offices": {
    slug: "engineering-offices",
    code: "EOF",
    faculty: "Engineering",
    rooms: [],
  },
  "New Hostel": {
    slug: "new-hostel",
    code: "NHST",
    faculty: "Other",
    rooms: [],
  },
  "ELF Lecture Theater": {
    slug: "elf-lecture-theater",
    code: "ELF",
    faculty: "Engineering",
    rooms: [],
  },
  "Faculty of Computing Science": {
    slug: "faculty-of-computing",
    code: "FCO",
    faculty: "Science",
    rooms: [],
  },
  "Entry point": {
    slug: "entry-point",
    code: "ENT",
    faculty: "Other",
    rooms: [],
  },
  "Female Presidential Hostel": {
    slug: "female-presidential-hostel",
    code: "FPH",
    faculty: "Other",
    rooms: [],
  },
  "Science Market": {
    slug: "science-market",
    code: "SMKT",
    faculty: "Other",
    rooms: [],
  },
  "Central Administrative Block, UNIUYO Main Campus": {
    slug: "admin-block",
    code: "ADM",
    faculty: "Administration",
    rooms: [],
  },
  "Convocation Park": {
    slug: "convocation-park",
    code: "CVK",
    faculty: "Other",
    rooms: [],
  },
  "Faculty of Engineering": {
    slug: "faculty-of-engineering",
    code: "FEN",
    faculty: "Engineering",
    rooms: [],
  },
  "New Engineering Block (NEB)": {
    slug: "neb",
    code: "NEB",
    faculty: "Engineering",
    rooms: [],
  },
  "Multi-purpose hall": {
    slug: "multi-purpose-hall",
    code: "MPH",
    faculty: "Other",
    rooms: [],
  },
}
