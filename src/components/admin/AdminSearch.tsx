import { useEffect, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Search } from "@solar-icons/react/category"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"
import { useSearchRooms } from "@/hooks/useRooms"
import { isApiConfigured } from "@/lib/api"
import { MOCK_VENUES } from "@/lib/mock-data"
import type { PaginatedResponse, SearchRoom } from "@/lib/api-types"

/** Backend GET /api/search/ returns a paginated object; accept a plain array too. */
function normalizeSearchResults(
  data: SearchRoom[] | PaginatedResponse<SearchRoom> | undefined,
): SearchRoom[] {
  if (!data) return []
  return Array.isArray(data) ? data : (data.results ?? [])
}

interface AdminPageHit {
  label: string
  hint: string
  to: string
  search?: { step: number }
}

const ADMIN_PAGES: AdminPageHit[] = [
  { label: "Dashboard", hint: "Admin overview", to: "/admin/dashboard" },
  { label: "Venues", hint: "Manage rooms", to: "/admin/venues" },
  { label: "Timetables", hint: "Upload history", to: "/admin/timetables" },
  {
    label: "Upload timetable",
    hint: "Upload a timetable PDF",
    to: "/admin/timetables/upload",
    search: { step: 1 },
  },
  { label: "Overrides", hint: "Manual adjustments", to: "/admin/overrides" },
]

export function AdminSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounced = useDebounce(query.trim(), 250)
  const useApi = isApiConfigured()

  const { data: apiRooms, isFetching } = useSearchRooms(debounced, 1, useApi)

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const q = debounced.toLowerCase()
  const pageHits =
    q.length === 0
      ? []
      : ADMIN_PAGES.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.hint.toLowerCase().includes(q),
        )

  const venueHits =
    q.length === 0
      ? []
      : useApi
        ? normalizeSearchResults(apiRooms)
            .slice(0, 6)
            .map((r) => ({
              id: r.slug,
              name: r.name,
              sub: r.building?.name ?? r.building?.code ?? "",
            }))
        : MOCK_VENUES.filter((v) => v.name.toLowerCase().includes(q))
            .slice(0, 6)
            .map((v) => ({ id: v.id, name: v.name, sub: v.building }))

  const showPanel = open && q.length > 0
  const hasResults = pageHits.length > 0 || venueHits.length > 0

  const goToVenue = (id: string) => {
    setOpen(false)
    setQuery("")
    navigate({ to: "/venue/$id", params: { id } })
  }

  const goToPage = (page: AdminPageHit) => {
    setOpen(false)
    setQuery("")
    navigate(
      page.search ? { to: page.to, search: page.search } : { to: page.to },
    )
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search.Magnifier
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
        size={18}
      />
      <Input
        placeholder="Search pages, venues…"
        className="pl-10 w-full"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (pageHits.length > 0) goToPage(pageHits[0])
            else if (venueHits.length > 0) goToVenue(venueHits[0].id)
          }
        }}
        role="combobox"
        aria-expanded={showPanel}
        aria-label="Search admin pages and venues"
      />
      {showPanel && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {useApi && isFetching ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Searching venues…
            </p>
          ) : !hasResults ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No pages or venues match “{debounced}”.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-2">
              {pageHits.length > 0 && (
                <div>
                  <p className="px-4 pb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Pages
                  </p>
                  {pageHits.map((p) => (
                    <button
                      key={p.to}
                      onClick={() => goToPage(p)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50"
                    >
                      <span className="text-sm font-bold text-slate-900">
                        {p.label}
                      </span>
                      <span className="text-xs text-slate-400">{p.hint}</span>
                    </button>
                  ))}
                </div>
              )}
              {venueHits.length > 0 && (
                <div>
                  <p className="px-4 pb-1 pt-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Venues
                  </p>
                  {venueHits.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => goToVenue(v.id)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50"
                    >
                      <span className="text-sm font-bold text-slate-900">
                        {v.name}
                      </span>
                      {v.sub ? (
                        <span className="text-xs text-slate-400">{v.sub}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
