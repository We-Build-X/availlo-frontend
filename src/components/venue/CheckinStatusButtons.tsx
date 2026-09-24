import { useState } from "react"
import { CheckCircle, CloseCircle } from "@solar-icons/react"
import { Button } from "@/components/ui/button"
import { isApiConfigured } from "@/lib/api"
import { useCheckinsSocket } from "@/hooks/useCheckins"
import type { CheckinVote } from "@/lib/api-types"

type CheckinStatusButtonsProps = {
  slug?: string
}

const LOCAL_INITIAL = { occupied: 17, free: 3 }

function ShareBar({ occupied, free }: { occupied: number; free: number }) {
  const total = occupied + free
  const occupiedPct = total > 0 ? Math.round((occupied / total) * 100) : 50
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
      role="img"
      aria-label={`${occupied} occupied check-ins, ${free} free check-ins`}
    >
      <div
        className="bg-red-400 transition-all duration-500"
        style={{ width: `${occupiedPct}%` }}
      />
      <div className="flex-1 bg-blue-400 transition-all duration-500" />
    </div>
  )
}

function StatusBadge({
  isLive,
  isPolling,
}: {
  isLive: boolean
  isPolling: boolean
}) {
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-700">
        <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
        Live
      </span>
    )
  }
  if (isPolling) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600">
        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        Updating
      </span>
    )
  }
  return null
}

export function CheckinStatusButtons({ slug }: CheckinStatusButtonsProps) {
  const liveEnabled = isApiConfigured() && !!slug
  const { counts, userVote, vote, isVoting, socketStatus, isLive } =
    useCheckinsSocket(liveEnabled ? slug : undefined)

  // Offline/mock fallback: local-only counts when the API is not configured.
  const [localOccupied, setLocalOccupied] = useState(LOCAL_INITIAL.occupied)
  const [localFree, setLocalFree] = useState(LOCAL_INITIAL.free)
  const [localVote, setLocalVote] = useState<CheckinVote | null>(null)

  const occupied = liveEnabled ? (counts?.occupied ?? 0) : localOccupied
  const free = liveEnabled ? (counts?.free ?? 0) : localFree
  const currentVote = liveEnabled ? userVote : localVote

  const handleCheckin = (checkin: CheckinVote) => {
    if (!liveEnabled) {
      if (localVote === checkin) return
      if (localVote === "occupied") setLocalOccupied((p) => Math.max(0, p - 1))
      if (localVote === "free") setLocalFree((p) => Math.max(0, p - 1))
      if (checkin === "occupied") setLocalOccupied((p) => p + 1)
      else setLocalFree((p) => p + 1)
      setLocalVote(checkin)
      return
    }
    if (isVoting || userVote === checkin) return
    vote(checkin)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="text-lg font-bold uppercase tracking-wider text-slate-900">
            Check in to help others
          </h3>
          {liveEnabled && (
            <StatusBadge
              isLive={isLive}
              isPolling={
                socketStatus === "polling" || socketStatus === "connecting"
              }
            />
          )}
        </div>
        <p className="text-base text-slate-500 font-medium leading-relaxed">
          Is this room occupied or free right now? Your check-in updates the
          live count for everyone on campus.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => handleCheckin("occupied")}
          disabled={liveEnabled && (isVoting || !counts)}
          className={`h-auto flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
            currentVote === "occupied"
              ? "bg-red-100 border-red-200 shadow-inner"
              : "bg-white border-slate-200 hover:border-red-200 hover:shadow-md"
          }`}
        >
          <CheckCircle
            className={`size-6.5 ${currentVote === "occupied" ? "text-red-500" : "text-slate-400"}`}
            weight={currentVote === "occupied" ? "Bold" : "Linear"}
          />
          <span
            className={`mt-2 text-sm font-bold uppercase tracking-wide ${currentVote === "occupied" ? "text-red-700" : "text-slate-600"}`}
          >
            Occupied ({occupied})
          </span>
        </Button>
        <Button
          variant="outline"
          onClick={() => handleCheckin("free")}
          disabled={liveEnabled && (isVoting || !counts)}
          className={`h-auto flex flex-col items-center justify-center p-6  rounded-xl border-2 transition-all duration-300 ${
            currentVote === "free"
              ? "bg-blue-100 border-blue-200 shadow-inner"
              : "bg-white border-slate-200 hover:border-blue-200 !hover:bg-blue-500/10 hover:shadow-md"
          }`}
        >
          <CloseCircle
            className={`size-6.5 ${currentVote === "free" ? "text-blue-500" : "text-slate-400"}`}
            weight={currentVote === "free" ? "Bold" : "Linear"}
          />
          <span
            className={`mt-2 text-sm font-bold uppercase tracking-wide ${currentVote === "free" ? "text-blue-700" : "text-slate-600"}`}
          >
            Free ({free})
          </span>
        </Button>
      </div>
      <ShareBar occupied={occupied} free={free} />
      {currentVote && (
        <p className="text-[10px] font-bold uppercase text-center text-slate-400 animate-in fade-in slide-in-from-bottom-1">
          Thanks for checking in!
        </p>
      )}
    </div>
  )
}
