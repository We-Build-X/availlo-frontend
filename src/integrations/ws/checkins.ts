import { ENDPOINTS, isWsConfigured } from "@/lib/ENDPOINTS"
import type { CheckinSnapshot } from "@/lib/api-types"

export type CheckinsSocketStatus = "connecting" | "live" | "polling" | "closed"

export interface CheckinsSocketEvents {
  onSnapshot: (snapshot: CheckinSnapshot) => void
  onStatusChange?: (status: CheckinsSocketStatus, detail?: string) => void
}

export interface ConnectCheckinsSocketOptions extends CheckinsSocketEvents {
  slug: string
  /** Max reconnect attempts for abnormal closes. Defaults to Infinity. */
  maxRetries?: number
  /** Base delay (ms) for exponential backoff. Defaults to 1000. */
  baseDelayMs?: number
  /** Cap (ms) for backoff delay. Defaults to 30_000. */
  maxDelayMs?: number
  /** Keep-alive ping interval (ms). Defaults to 25_000. */
  pingIntervalMs?: number
}

const CLOSE_UNKNOWN_ROOM = 4404
const CLOSE_TRY_AGAIN_LATER = 1013

function isSnapshot(value: unknown): value is CheckinSnapshot {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.room === "string" &&
    typeof v.occupied === "number" &&
    typeof v.free === "number" &&
    typeof v.total === "number" &&
    typeof v.live === "boolean"
  )
}

function backoffDelay(attempt: number, base: number, max: number): number {
  const delay = base * 2 ** attempt + Math.random() * 250
  return Math.min(delay, max)
}

/**
 * Open the live check-in socket for a room and keep it alive.
 *
 * Contract (backend: apps/checkins/consumers.py):
 * - URL: ws(s):///ws/rooms/<slug>/votes/ (push-only; inbound ignored except "ping")
 * - First frame is always a snapshot {room, occupied, free, total, live}
 * - Broadcasts on every POST vote carry live: true
 * - Close 4404 = unknown slug (do not retry); 1013 = degraded mode
 *   (snapshot already delivered, fall back to REST polling + retry later)
 *
 * Returns a cleanup function that stops reconnects/pings and closes the socket.
 */
export function connectCheckinsSocket(
  options: ConnectCheckinsSocketOptions,
): () => void {
  const {
    slug,
    onSnapshot,
    onStatusChange,
    maxRetries = Number.POSITIVE_INFINITY,
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    pingIntervalMs = 25_000,
  } = options

  let socket: WebSocket | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let attempt = 0
  let cancelled = false

  const setStatus = (status: CheckinsSocketStatus, detail?: string) => {
    onStatusChange?.(status, detail)
  }

  const clearTimers = () => {
    if (pingTimer !== null) clearInterval(pingTimer)
    if (retryTimer !== null) clearTimeout(retryTimer)
    pingTimer = null
    retryTimer = null
  }

  const scheduleReconnect = () => {
    if (cancelled || attempt >= maxRetries) {
      if (!cancelled) setStatus("polling", "reconnect budget exhausted")
      return
    }
    const delay = backoffDelay(attempt, baseDelayMs, maxDelayMs)
    attempt += 1
    setStatus("connecting", `retry ${attempt} in ${Math.round(delay)}ms`)
    retryTimer = setTimeout(() => {
      if (!cancelled) open()
    }, delay)
  }

  const open = () => {
    if (cancelled || !isWsConfigured()) return
    clearTimers()
    setStatus("connecting")
    socket = new WebSocket(ENDPOINTS.checkins.votesSocket(slug))

    socket.onmessage = (event) => {
      if (event.data === "pong") return
      if (typeof event.data !== "string") return
      let parsed: unknown
      try {
        parsed = JSON.parse(event.data)
      } catch {
        return
      }
      if (!isSnapshot(parsed)) return
      attempt = 0
      onSnapshot(parsed)
      setStatus(
        parsed.live ? "live" : "polling",
        parsed.live ? undefined : "degraded mode",
      )
    }

    socket.onclose = (event) => {
      clearTimers()
      socket = null
      if (cancelled) return
      if (event.code === CLOSE_UNKNOWN_ROOM) {
        setStatus("closed", `unknown room: ${slug}`)
        return
      }
      if (event.code === CLOSE_TRY_AGAIN_LATER) {
        // Degraded mode: snapshot was delivered, socket intentionally closed.
        // REST polling covers updates; retry in the background.
        setStatus("polling", "degraded mode, retrying")
        scheduleReconnect()
        return
      }
      scheduleReconnect()
    }

    socket.onerror = () => {
      // onclose follows error and drives the retry path; nothing to do here.
    }

    pingTimer = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send("ping")
      }
    }, pingIntervalMs)
  }

  open()

  return () => {
    cancelled = true
    clearTimers()
    if (socket !== null) {
      // 1000 = normal closure; skips the reconnect path via `cancelled`.
      try {
        socket.close(1000)
      } catch {
        // Already closed; ignore.
      }
      socket = null
    }
  }
}

/** Stable per-browser voter identity for POST /vote/ (backend uses it as session_key). */
const VOTER_KEY_STORAGE = "availlo_voter_key"

export function getVoterKey(): string {
  try {
    const existing = localStorage.getItem(VOTER_KEY_STORAGE)
    if (existing && existing.trim().length > 0) return existing
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `voter-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
    localStorage.setItem(VOTER_KEY_STORAGE, fresh)
    return fresh
  } catch {
    return `voter-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  }
}
