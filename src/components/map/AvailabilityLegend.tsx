/**
 * AvailabilityLegend
 *
 * Small floating legend that shows what each marker colour means.
 * Top-left of the map so it doesn't fight the Mapbox NavigationControl
 * in the top-right. Pure CSS, no JS — uses the same colour tokens as
 * the marker paint expression in CampusMap.tsx.
 */

const ITEMS: { label: string; color: string }[] = [
  { label: "Free", color: "#10b981" },
  { label: "Ending soon", color: "#f59e0b" },
  { label: "Occupied", color: "#ef4444" },
  { label: "No data", color: "#9ca3af" },
]

export function AvailabilityLegend({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={
        className ??
        "absolute top-3 left-3 z-10 rounded-xl border border-neutral-200 bg-white/90 p-2.5 shadow-sm backdrop-blur"
      }
    >
      <p className="mb-1.5 text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
        Availability
      </p>
      <ul className="space-y-1">
        {ITEMS.map((it) => (
          <li
            key={it.label}
            className="flex items-center gap-2 text-xs text-neutral-700"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: it.color }}
            />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
