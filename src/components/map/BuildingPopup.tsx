/**
 * BuildingPopup
 *
 * Content of the popup shown when a user clicks a building marker on
 * the campus map. Shows the building's image (with a satellite tile
 * fallback if the building has no dedicated photo), title, description,
 * and a list of rooms inside the building with per-room status badges
 * and a "View" link to /venue/$id.
 *
 * Mirrors the look of the existing Venue page (src/pages/Venue.tsx)
 * so the design language is consistent across the app.
 */

import { useState } from "react"
import type { BuildingFeature } from "@/hooks/useBuildingStatus"
import { getAvailabilityText } from "@/lib/time"

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  FREE: { bg: "bg-green-50", text: "text-green-600" },
  ENDING_SOON: { bg: "bg-amber-50", text: "text-amber-600" },
  OCCUPIED: { bg: "bg-red-50", text: "text-red-600" },
  UNKNOWN: { bg: "bg-neutral-100", text: "text-neutral-500" },
}

const STATUS_LABEL: Record<string, string> = {
  FREE: "FREE",
  ENDING_SOON: "ENDING SOON",
  OCCUPIED: "OCCUPIED",
  UNKNOWN: "—",
}

interface BuildingPopupProps {
  building: BuildingFeature
}

export function BuildingPopup({ building }: BuildingPopupProps) {
  // Per-building photo only: buildings without their own `image` show no
  // picture at all (backend room images, when present, appear on venue
  // pages via mapRoomDetailToVenue, not here). A broken URL hides itself.
  const [imageSrc, setImageSrc] = useState<string>(building.image ?? "")

  const handleImageError = () => {
    setImageSrc("")
  }

  const status = building.status
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.UNKNOWN

  return (
    <div className="font-poppins">
      {imageSrc && (
        <img
          src={imageSrc}
          alt={building.title}
          onError={handleImageError}
          className="h-32 w-full rounded-t-lg object-cover"
        />
      )}

      <div className="p-3">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {building.code && (
              <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                {building.code}
              </p>
            )}
            <h3 className="truncate text-base font-bold text-neutral-900">
              {building.title}
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-widest uppercase ${statusColor.bg} ${statusColor.text}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        {building.description && (
          <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
            {building.description}
          </p>
        )}

        {building.rooms.length > 0 ? (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
              Rooms ({building.rooms.length})
            </p>
            <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
              {building.rooms.map((room) => {
                const rs = room.availability.status
                const rc = STATUS_COLORS[rs] ?? STATUS_COLORS.UNKNOWN
                return (
                  <li
                    key={room.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-neutral-900">
                        {room.name}
                      </p>
                      <p className={`text-[10px] font-bold ${rc.text}`}>
                        {getAvailabilityText(room.availability)}
                      </p>
                    </div>
                    <a
                      href={`/venue/${room.id}`}
                      className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${rc.bg} ${rc.text}`}
                    >
                      View
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : import.meta.env.DEV ? (
          <p className="mt-3 text-[10px] text-neutral-400 italic">
            No rooms resolved for this building (dev only — hidden in prod).
          </p>
        ) : null}
      </div>
    </div>
  )
}
