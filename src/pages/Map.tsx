/**
 * /map
 *
 * Full-bleed campus map. The route is mounted directly under the root
 * route (not under publicLayoutRoute) so the app's header, bottom
 * nav, and footer don't frame the map. The map itself is rendered by
 * CampusMap.tsx, which owns the Mapbox lifecycle.
 */

import { CampusMap } from "@/components/map/CampusMap"
import { useBuildingStatus } from "@/hooks/useBuildingStatus"

export default function Map() {
  const { data: buildings, isLoading, isMock } = useBuildingStatus()

  return (
    <div className="relative h-dvh min-h-screen w-screen overflow-hidden" style={{ height: "100dvh", minHeight: "100vh" }}>
      {isLoading && buildings.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center bg-neutral-50">
          <p className="text-sm text-neutral-500">Loading buildings…</p>
        </div>
      ) : buildings.length === 0 ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-50 p-8 text-center">
          <p className="text-base font-bold text-neutral-900">No buildings to show</p>
          <p className="mt-1 max-w-md text-sm text-neutral-500">
            {isMock
              ? "No mock venues matched the campus buildings. Check building-room-join data."
              : "The server returned no rooms. Upload a timetable or add venues in /admin/venues."}
          </p>
        </div>
      ) : (
        <CampusMap buildings={buildings} />
      )}
    </div>
  )
}
