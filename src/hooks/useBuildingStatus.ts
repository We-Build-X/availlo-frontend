/**
 * useBuildingStatus
 *
 * Joins the campus-buildings.geojson (one marker per BUILDING) with the
 * room records served by the Availlo backend at /api/rooms/ (one record
 * per ROOM) and computes a single "worst-case" availability status for
 * each building. That status is what the map marker colour reflects.
 *
 * Status precedence (most urgent wins):
 *   OCCUPIED > ENDING_SOON > FREE > UNKNOWN
 *
 * The hook also returns the full per-room list for each building, so
 * the popup can render the room list with individual status badges.
 *
 * If the backend is not configured (USE_API === false), the hook falls
 * back to the mock venue data in src/lib/mock-data.ts — same pattern as
 * the rest of the app (see src/pages/Explore.tsx).
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, isApiConfigured } from "@/lib/api";
import { ENDPOINTS } from "@/lib/ENDPOINTS";
import type { Room } from "@/lib/api-types";
import { MOCK_VENUES, mapRoomToVenue } from "@/lib/mock-data";
import type { Venue } from "@/lib/mock-data";
import buildingsGeoJson from "@/data/campus-buildings.json";
import { BUILDING_TO_ROOMS, slugify } from "@/data/building-room-join";

// Minimal GeoJSON types we need — keep them local to avoid pulling in
// @types/geojson just for two shapes.
type BuildingFeatureProps = {
  title: string;
  description: string;
  image?: string;
};
type BuildingFeatureGeoJson = {
  features: Array<{
    type: "Feature";
    properties: BuildingFeatureProps;
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
};

export type BuildingStatus = "FREE" | "ENDING_SOON" | "OCCUPIED" | "UNKNOWN";

export interface BuildingFeature {
  /** Stable slug (used for Mapbox feature-state tracking). */
  slug: string;
  /** Building name as it appears in the GeoJSON. */
  title: string;
  /** Short blurb from the GeoJSON. */
  description: string;
  /** [lng, lat]. */
  coordinates: [number, number];
  /** Optional per-building image (path under /public). */
  image?: string;
  /** Optional faculty hint from the join table. */
  faculty:
    | "Engineering"
    | "Science"
    | "Arts"
    | "Agriculture"
    | "Computing"
    | "Other";
  /** Short building code (e.g. "NECB"). */
  code: string;
  /** Worst-case status of the building's rooms. */
  status: BuildingStatus;
  /** Per-room view for the popup. Empty if the backend has no rooms yet. */
  rooms: Venue[];
}

const STATUS_PRIORITY: Record<BuildingStatus, number> = {
  OCCUPIED: 3,
  ENDING_SOON: 2,
  FREE: 1,
  UNKNOWN: 0,
};

const worstStatus = (statuses: BuildingStatus[]): BuildingStatus => {
  if (statuses.length === 0) return "UNKNOWN";
  return statuses.reduce<BuildingStatus>(
    (worst, current) =>
      STATUS_PRIORITY[current] > STATUS_PRIORITY[worst] ? current : worst,
    "UNKNOWN",
  );
};

const USE_API = isApiConfigured();

/**
 * Hook to fetch the list of rooms. Returns either the API response
 * (mapped to Venue[]) or the mock data, depending on USE_API.
 */
function useAllRooms() {
  return useQuery({
    queryKey: ["rooms", "all"],
    queryFn: async () => {
      const { data } = await api.get<Room[]>(ENDPOINTS.rooms.list);
      return data.map(mapRoomToVenue);
    },
    enabled: USE_API,
    staleTime: 30_000,
  });
}

/**
 * Returns an array of BuildingFeature, one per building in the GeoJSON.
 * The order matches the GeoJSON order.
 */
export function useBuildingStatus(): {
  data: BuildingFeature[];
  isLoading: boolean;
  isMock: boolean;
} {
  const apiQuery = useAllRooms();

  return useMemo(() => {
    const rooms: Venue[] = USE_API ? (apiQuery.data ?? []) : MOCK_VENUES;

    // Match rooms to buildings by building.code — real /api/rooms/ records
    // carry a Building object with a `code` (e.g. "NECB"), which
    // mapRoomToVenue() exposes as venue.building. The join table's `code`
    // field is the key that links them, not `rooms: number[]` (empty) or
    // building names (which differ between GeoJSON titles and room data).
    const roomsByBuildingCode = new Map<string, Venue[]>();
    for (const r of rooms) {
      const code = r.building.toUpperCase();
      const list = roomsByBuildingCode.get(code) ?? [];
      list.push(r);
      roomsByBuildingCode.set(code, list);
    }

    // Fallback index for buildings with no join entry: match by the
    // GeoJSON title against the building name from the API.
    const roomsByBuildingName = new Map<string, Venue[]>();
    for (const r of rooms) {
      const list = roomsByBuildingName.get(r.fullName) ?? [];
      list.push(r);
      roomsByBuildingName.set(r.fullName, list);
    }

    const features = (buildingsGeoJson as BuildingFeatureGeoJson).features;

    const buildings: BuildingFeature[] = features.map((f) => {
      const title = f.properties.title;
      const join = BUILDING_TO_ROOMS[title];
      const fallbackSlug = slugify(title);

      // Prefer the building-code match — the backend room records carry
      // a Building.code (e.g. "NECB") which mapRoomToVenue() exposes as
      // venue.building, and the join table's `code` field is the same
      // key. Fall back to a name match against the API response when a
      // building has no join entry (rooms: []).
      let buildingRooms: Venue[] = [];
      if (join && join.code) {
        buildingRooms = roomsByBuildingCode.get(join.code.toUpperCase()) ?? [];
      }
      if (buildingRooms.length === 0) {
        buildingRooms = roomsByBuildingName.get(title) ?? [];
      }

      const status = worstStatus(
        buildingRooms.map((r) => r.availability.status as BuildingStatus),
      );

      return {
        slug: join?.slug ?? fallbackSlug,
        title,
        description: f.properties.description,
        coordinates: f.geometry.coordinates,
        image: f.properties.image,
        faculty: join?.faculty ?? "Other",
        code: join?.code ?? "",
        status,
        rooms: buildingRooms,
      };
    });

    return {
      data: buildings,
      isLoading: USE_API && apiQuery.isPending,
      isMock: !USE_API,
    };
  }, [apiQuery.data, apiQuery.isPending]);
}
