/**
 * Campus3D (/3d)
 *
 * Full-bleed immersive campus viewer — sibling of /map, also mounted
 * directly under the root route (no Header/Footer). Deliberately lazy:
 * the page component imports nothing from three; the scene chunk loads
 * only when someone actually opens /3d.
 *
 * - WebGL support probed BEFORE the scene chunk is fetched, so old
 *   devices get a clean explanation instead of a black canvas.
 * - Availability statuses come from useBuildingStatus — the exact same
 *   join that colors /map markers, so the two surfaces agree.
 * - Tapping a named venue opens the inspect sheet (title, status,
 *   faculty, room summary, link back to /map).
 */

import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRightUp, CloseCircle } from "@solar-icons/react";
import {
  useBuildingStatus,
  type BuildingFeature,
  type BuildingStatus,
} from "@/hooks/useBuildingStatus";

// Lazy on purpose: everything three lives in its own chunk.
const CampusScene = lazy(() => import("@/components/campus3d/CampusScene"));

const hasWebGL = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
};

const STATUS_LABEL: Record<BuildingStatus, string> = {
  FREE: "Free",
  ENDING_SOON: "Ending soon",
  OCCUPIED: "Occupied",
  UNKNOWN: "No data",
};
const STATUS_CLASS: Record<BuildingStatus, string> = {
  FREE: "bg-emerald-100 text-emerald-800",
  ENDING_SOON: "bg-amber-100 text-amber-800",
  OCCUPIED: "bg-red-100 text-red-800",
  UNKNOWN: "bg-neutral-100 text-neutral-600",
};

export default function Campus3D() {
  const navigate = useNavigate();
  const supported = useMemo(hasWebGL, []);
  const { data: buildings, isLoading, isMock } = useBuildingStatus();

  const [selected, setSelected] = useState<string | null>(null);

  const statusBySlug = useMemo(() => {
    const m = new Map<string, BuildingStatus>();
    for (const b of buildings) m.set(b.slug, b.status);
    return m;
  }, [buildings]);

  const selectedVenue: BuildingFeature | undefined = useMemo(
    () => buildings.find((b) => b.slug === selected),
    [buildings, selected],
  );

  const onSelect = useCallback((slug: string) => {
    setSelected(slug || null);
  }, []);

  const freeCount = useMemo(
    () => buildings.filter((b) => b.status === "FREE").length,
    [buildings],
  );

  if (!supported) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-neutral-50 p-8">
        <div className="max-w-sm text-center">
          <h1 className="mb-2 text-lg font-bold text-neutral-900">
            3D view unavailable
          </h1>
          <p className="mb-6 text-sm text-neutral-600">
            This device or browser doesn't report WebGL support, which the
            3D campus needs. The 2D map has the same availability colors
            and real building footprints.
          </p>
          <Link
            to="/map"
            className="inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
          >
            Open 2D map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#f0ebdf]">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              <p className="text-sm text-neutral-500">Loading 3D campus…</p>
            </div>
          </div>
        }
      >
        <CampusScene
          statusBySlug={statusBySlug}
          onSelect={onSelect}
          focusSlug={selected ?? null}
        />
      </Suspense>

      {/* Back */}
      <button
        type="button"
        onClick={() => navigate({ to: "/map" })}
        aria-label="Back to 2D map"
        className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
      >
        <ArrowLeft size={16} /> 2D map
      </button>

      {/* Availability summary chip */}
      <div className="absolute top-3 right-3 z-10 rounded-full bg-white/95 px-3.5 py-2 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
        {isMock ? (
          <span>demo data — {freeCount} venues free</span>
        ) : isLoading ? (
          <span>checking availability…</span>
        ) : (
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {freeCount} of {buildings.length} free
          </span>
        )}
      </div>

      {/* Hint — auto-hidden once a venue is selected */}
      {!selected && (
        <div className="absolute top-[4.75rem] left-3 z-10 rounded-xl bg-white/90 px-3 py-2 text-[11px] text-slate-600 shadow-sm backdrop-blur">
          drag to orbit · pinch / scroll to zoom · tap a green building
        </div>
      )}

      {/* Inspect sheet */}
      {selectedVenue && (
        <div className="absolute inset-x-2 bottom-4 z-20 mx-auto max-w-lg sm:inset-x-6">
          <div className="rounded-2xl bg-white/97 p-4 shadow-xl ring-1 ring-slate-200 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CLASS[selectedVenue.status]}`}
                  >
                    {STATUS_LABEL[selectedVenue.status]}
                  </span>
                  {selectedVenue.code && (
                    <span className="text-[11px] font-semibold tracking-wide text-neutral-400">
                      {selectedVenue.code}
                    </span>
                  )}
                </div>
                <h2 className="mt-1.5 truncate text-base font-bold text-neutral-900">
                  {selectedVenue.title}
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {selectedVenue.faculty !== "Other"
                    ? `${selectedVenue.faculty} · `
                    : ""}
                  {selectedVenue.rooms.length} room
                  {selectedVenue.rooms.length === 1 ? "" : "s"} tracked
                  {isMock ? " (demo data)" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <CloseCircle size={18} />
              </button>
            </div>

            {selectedVenue.rooms.length > 0 && (
              <ul className="mt-3 max-h-36 space-y-1.5 overflow-y-auto pr-1">
                {selectedVenue.rooms.slice(0, 6).map((r) => (
                  <li
                    key={r.id ?? r.fullName}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="truncate text-neutral-700">
                      {r.fullName}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.availability.status === "FREE"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.availability.status === "ENDING_SOON"
                            ? "bg-amber-100 text-amber-700"
                            : r.availability.status === "OCCUPIED"
                              ? "bg-red-100 text-red-700"
                              : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {STATUS_LABEL[
                        (r.availability.status as BuildingStatus) ?? "UNKNOWN"
                      ] ?? r.availability.status}
                    </span>
                  </li>
                ))}
                {selectedVenue.rooms.length > 6 && (
                  <li className="text-center text-[11px] text-neutral-400">
                    +{selectedVenue.rooms.length - 6} more
                  </li>
                )}
              </ul>
            )}

            <Link
              to="/map"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              <ArrowRightUp size={14} /> Get directions on 2D map
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
