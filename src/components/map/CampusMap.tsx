/**
 * CampusMap
 *
 * Renders the Mapbox GL map for /map. Adds a runtime GeoJSON source
 * from campus-buildings.geojson, a circle layer whose color is driven
 * by per-building status (set via setFeatureState), NavigationControl,
 * GeolocateControl, and a ScaleControl. Clicking a marker opens a
 * popup with building details and a list of rooms.
 *
 * The map style is read from VITE_MAPBOX_STYLE .
 * If no token is configured, the component renders a setup notice instead
 * of the map so the rest of the app keeps working.
 */

import { useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import type { Root } from "react-dom/client"
import {
  mapboxgl,
  MAPBOX_STYLE,
  CAMPUS_BOUNDS,
  CAMPUS_CENTER,
} from "@/integrations/mapbox/client"
import "mapbox-gl/dist/mapbox-gl.css"
import type { BuildingFeature, BuildingStatus } from "@/hooks/useBuildingStatus"
import { BuildingPopup } from "./BuildingPopup"
import { AvailabilityLegend } from "./AvailabilityLegend"

const STATUS_TO_COLOR: Record<BuildingStatus, string> = {
  FREE: "#10b981", // green-500
  ENDING_SOON: "#f59e0b", // amber-500
  OCCUPIED: "#ef4444", // red-500
  UNKNOWN: "#9ca3af", // gray-400
}

interface CampusMapProps {
  buildings: BuildingFeature[]
}

export function CampusMap({ buildings }: CampusMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const buildingsRef = useRef(buildings)
  buildingsRef.current = buildings
  const [ready, setReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [styleLoaded, setStyleLoaded] = useState(false)
  const [layerInfo, setLayerInfo] = useState<string>("layer: pending")
  const [viewInfo, setViewInfo] = useState<string>("view: pending")
  const hasToken = !!import.meta.env.VITE_MAPBOX_TOKEN

  // ---- Init the map once on mount ------------------------------------------
  useEffect(() => {
    if (!hasToken) return
    if (!containerRef.current) return
    if (mapRef.current) return

    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE,
        center: CAMPUS_CENTER,
        zoom: 15,
        bounds: CAMPUS_BOUNDS,
        fitBoundsOptions: { padding: 48 },
        attributionControl: true,
      })
    } catch (err) {
      setMapError(err instanceof Error ? err.message : "Failed to create map")
      return
    }

    map.on("error", (e) => {
      const raw = e as { error?: unknown; type?: string }
      const msg =
        raw.error instanceof Error
          ? raw.error.message
          : typeof raw.error === "string"
            ? raw.error
            : JSON.stringify(raw.error ?? e)
      console.error(`[mapbox] map error (${raw.type ?? "unknown"}):`, msg)
      setMapError(`${msg}`)
    })
    map.on("load", () => setStyleLoaded(true))

    map.addControl(new mapboxgl.NavigationControl(), "top-right")
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right",
    )
    map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left")

    // The container can measure 0 or shift while layout/fonts settle;
    // force a resize once the style is ready and on window resizes so the
    // canvas never stays blank from a stale size.
    const doResize = () => {
      try {
        map.resize()
      } catch (err) {
        console.error("[mapbox] resize failed:", err)
      }
    }
    map.once("load", doResize)
    window.addEventListener("resize", doResize)

    mapRef.current = map
    setReady(true)

    return () => {
      window.removeEventListener("resize", doResize)
      popupRef.current?.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [hasToken])

  // ---- Buildings source + layer: persistent reconciler -----------------------
  // Re-runs on a timer (not just once) so a style reload, remount, or any
  // missed "load" event can't leave the map permanently empty. Event
  // handlers are bound once per map instance; data refreshes when rooms
  // resolve. Any throw is surfaced in the error banner.
  useEffect(() => {
    if (!ready) return
    const map = mapRef.current
    if (!map) return
    let cancelled = false
    let handlersBound = false
    let lastDataJson = ""

    const buildData = () => {
      const buildingsNow = buildingsRef.current
      return {
        buildingsNow,
        data: {
          type: "FeatureCollection",
          features: buildingsNow.map((b) => ({
            type: "Feature",
            id: b.slug,
            geometry: { type: "Point", coordinates: b.coordinates },
            properties: {
              slug: b.slug,
              title: b.title,
              description: b.description,
              image: b.image ?? null,
              code: b.code,
              faculty: b.faculty,
            },
          })),
        } as GeoJSON.FeatureCollection,
      }
    }

    const bindHandlers = () => {
      if (handlersBound) return
      handlersBound = true
      map.on("mouseenter", "campus-buildings-circle", () => {
        map.getCanvas().style.cursor = "pointer"
      })
      map.on("mouseleave", "campus-buildings-circle", () => {
        map.getCanvas().style.cursor = ""
      })
      map.on("click", "campus-buildings-circle", (e) => {
        const feature = e.features?.[0] as unknown as
          | {
              properties?: { slug?: string }
              geometry?: { coordinates: [number, number] }
            }
          | undefined
        if (!feature) return
        const slug = feature.properties?.slug ?? ""
        const building = buildingsRef.current.find((b) => b.slug === slug)
        if (!building) return

        const coordinates = feature.geometry?.coordinates
        if (!coordinates) return
        popupRef.current?.remove()

        const popupNode = document.createElement("div")
        const root: Root = createRoot(popupNode)
        root.render(<BuildingPopup building={building} />)
        popupRef.current = new mapboxgl.Popup({
          offset: 18,
          closeButton: true,
          maxWidth: "320px",
          className: "availlo-map-popup",
        })
          .setLngLat(coordinates)
          .setDOMContent(popupNode)
          .addTo(map)
        popupRef.current.on("close", () => {
          root.unmount()
          popupRef.current = null
        })
      })
    }

    const ensure = () => {
      if (cancelled) return
      if (!map.isStyleLoaded()) {
        setLayerInfo("layer: waiting for style…")
        return
      }
      const { buildingsNow, data } = buildData()
      try {
        const source = map.getSource("campus-buildings") as
          | mapboxgl.GeoJSONSource
          | undefined
        if (!source) {
          map.addSource("campus-buildings", {
            type: "geojson",
            data,
            promoteId: "slug",
          })
          lastDataJson = JSON.stringify(data)
        } else {
          const json = JSON.stringify(data)
          if (json !== lastDataJson) {
            source.setData(data)
            lastDataJson = json
          }
        }
        if (!map.getLayer("campus-buildings-circle")) {
          map.addLayer({
            id: "campus-buildings-circle",
            type: "circle",
            source: "campus-buildings",
            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14,
                6,
                17,
                12,
              ],
              "circle-color": [
                "match",
                ["feature-state", "status"],
                "FREE",
                STATUS_TO_COLOR.FREE,
                "ENDING_SOON",
                STATUS_TO_COLOR.ENDING_SOON,
                "OCCUPIED",
                STATUS_TO_COLOR.OCCUPIED,
                STATUS_TO_COLOR.UNKNOWN,
              ],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
              "circle-opacity": 0.95,
            },
          })
        }
        bindHandlers()
        setLayerInfo(`layer: ok (${buildingsNow.length} markers)`)
        // Clear any earlier transient failure now that setup succeeded
        // (persistent tile/style errors re-emit via the map error event).
        setMapError(null)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[mapbox] ensure failed:", msg)
        setLayerInfo(`layer: setup failed (${msg})`)
        setMapError(msg)
      }
    }

    ensure()
    map.once("load", ensure)
    const t = window.setInterval(ensure, 2000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [ready, buildings])

  // ---- Live viewport diagnostics (temporary — remove once map confirmed) ----
  useEffect(() => {
    if (!ready) return
    const map = mapRef.current
    if (!map) return
    let cancelled = false
    const update = () => {
      if (cancelled) return
      const el = containerRef.current
      const w = el?.clientWidth ?? -1
      const h = el?.clientHeight ?? -1
      const canvas = el?.querySelector("canvas")
      const cw = canvas ? Number(canvas.width) : -1
      const ch = canvas ? Number(canvas.height) : -1
      let webgl: string
      try {
        webgl =
          typeof mapboxgl.supported === "function"
            ? mapboxgl.supported()
              ? "yes"
              : "NO"
            : "unknown"
      } catch {
        webgl = "err"
      }
      let inView: string
      // Guard: querying a missing layer FIRES a map error event, so only
      // query when the layer actually exists.
      if (!map.getLayer("campus-buildings-circle")) {
        inView = "no-layer"
      } else {
        try {
          inView = String(
            map.queryRenderedFeatures({
              layers: ["campus-buildings-circle"],
            }).length,
          )
        } catch (err) {
          inView = `err (${err instanceof Error ? err.message : err})`
        }
      }
      const c = map.getCenter()
      setViewInfo(
        `view ${w}x${h} canvas ${cw}x${ch} • webgl:${webgl} • zoom:${map.getZoom().toFixed(1)} • center:${c.lng.toFixed(3)},${c.lat.toFixed(3)} • in-view:${inView}`,
      )
    }
    update()
    map.on("idle", update)
    map.on("moveend", update)
    const t = window.setInterval(update, 2000)
    return () => {
      cancelled = true
      window.clearInterval(t)
      map.off("idle", update)
      map.off("moveend", update)
    }
  }, [ready])
  // Push per-building status into the map via setFeatureState.
  // (layerInfo is owned by the sync effect above; this only paints colors.)
  useEffect(() => {
    if (!ready) return
    const map = mapRef.current
    if (!map) return
    if (!map.getSource("campus-buildings")) return
    if (!map.getLayer("campus-buildings-circle")) return

    for (const b of buildings) {
      try {
        map.setFeatureState(
          { source: "campus-buildings", id: b.slug },
          { status: b.status },
        )
      } catch (err) {
        console.error("[mapbox] setFeatureState failed:", err)
        return
      }
    }
  }, [ready, buildings])

  if (!hasToken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-50 p-8 text-center">
        <div className="max-w-md">
          <h2 className="mb-2 text-xl font-bold text-neutral-900">
            Mapbox token not configured
          </h2>
          <p className="text-sm text-neutral-600">
            Add a public{" "}
            <code className="rounded bg-neutral-200 px-1 py-0.5">pk.*</code>{" "}
            token to{" "}
            <code className="rounded bg-neutral-200 px-1 py-0.5">
              availlo-app/.env
            </code>{" "}
            as{" "}
            <code className="rounded bg-neutral-200 px-1 py-0.5">
              VITE_MAPBOX_TOKEN
            </code>{" "}
            and restart the dev server. See{" "}
            <code className="rounded bg-neutral-200 px-1 py-0.5">
              .env.example
            </code>{" "}
            for details.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="absolute inset-0"
        data-testid="campus-map"
      />
      {mapError && (
        <div className="absolute left-1/2 top-4 z-10 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-red-200 bg-white/95 px-4 py-3 text-center shadow-lg">
          <p className="text-sm font-bold text-red-600">Map failed to load</p>
          <p className="mt-1 break-words text-xs text-neutral-500">{mapError}</p>
        </div>
      )}
      {ready && !mapError && <AvailabilityLegend />}
      <button
        type="button"
        onClick={() => {
          const map = mapRef.current
          if (!map) return
          const pts = buildingsRef.current.map((b) => b.coordinates)
          if (pts.length === 0) return
          const lngs = pts.map((p) => p[0])
          const lats = pts.map((p) => p[1])
          map.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 80, duration: 800 },
          )
        }}
        className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50"
      >
        Zoom to markers ({buildings.length})
      </button>
      {/* Diagnostic status line — remove once map is confirmed working */}
      <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 font-mono text-[10px] text-white">
        {`map: ${ready ? "ready" : "init"} • style: ${styleLoaded ? "loaded" : "loading…"} • buildings: ${buildings.length} • ${layerInfo}`}
      </div>
    </div>
  )
}
