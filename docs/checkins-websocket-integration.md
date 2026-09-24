# Check-ins WebSocket Integration

Live crowdsourced room status: WebSocket push for counts, REST for mutations.
Backend source: `We-Build-X/availlo-backend` (`main` @ `b84fa94`).
Naming follows the backend — everything is **check-ins** (`occupied` / `free`), not votes.

## 1. Backend contract

| Item          | Value                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| WS URL        | `ws(s)://<host>/ws/rooms/<slug>/votes/` (`apps/checkins/routing.py:6`, slug regex `[-\w]+`)                                   |
| ASGI          | `ProtocolTypeRouter`, WS via `AuthMiddlewareStack` (`classroom_radar/asgi.py:19-24`)                                          |
| Auth          | **None on the socket.** Consumer never reads `scope["user"]`. Identity is `voter_key` (opaque client string) in the REST body |
| Direction     | Push-only. Inbound frames ignored except literal `"ping"` → `"pong"` (`apps/checkins/consumers.py:59-62`)                     |
| Channel group | `room_votes_<slug>`; Redis `channels-redis` (15s socket / 5s connect timeout), `InMemoryChannelLayer` without Redis           |

### Message schemas (server → client, flat JSON — no `{type, payload}` envelope)

Snapshot (first frame on every connect, always delivered even if Redis is down):

```json
{ "room": "<slug>", "occupied": 12, "free": 5, "total": 17, "live": true }
```

Broadcast (one per `POST /vote/`, `live` always `true`):

```json
{ "room": "<slug>", "occupied": 13, "free": 5, "total": 18, "live": true }
```

`"type": "votes.update"` is the internal channel-layer routing key only — never on the wire.
There are no error frames; failures are close codes:

| Close code    | Meaning                                                | Client action                                         |
| ------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| `4404`        | Unknown slug                                           | Do **not** retry, do **not** poll                     |
| `1013`        | Degraded mode (Redis down; snapshot already delivered) | Fall back to REST polling, retry socket in background |
| anything else | Abnormal drop                                          | Reconnect with exponential backoff                    |

### REST endpoints (mutation + fallback)

- `POST /api/rooms/<slug>/vote/` `{ vote: "occupied" | "free", voter_key: string≤100 non-blank }` → `200 { room, user_vote, occupied, free, total }`. One active vote per `(room, voter_key)` (`update_or_create`) — re-checking-in **changes** the vote, never double-counts (`apps/checkins/views.py:60-112`, `models.py:15-21`).
- `GET /api/rooms/<slug>/votes/?voter_key=<key>` → `{ room, occupied, free, total, user_vote? }`. Poll every 10–15s as fallback (`views.py:115-158`).

## 2. Frontend architecture / data flow

```
CheckinStatusButtons (slug)
  └─ useCheckinsSocket(slug)                    src/hooks/useCheckins.ts
       ├─ useQuery ["checkins", slug]  ──GET /votes/?voter_key=── initial counts + user_vote
       ├─ connectCheckinsSocket()      ──WS /ws/rooms/<slug>/votes/── snapshots/broadcasts
       │    │                                    src/integrations/ws/checkins.ts
       │    └─ onSnapshot → queryClient.setQueryData(["checkins", slug]) → vote bars re-render
       └─ useMutation POST /vote/ ── optimistic counts, authoritative setQueryData on success
```

- `WS_BASE_URL` is derived from `VITE_API_BASE_URL` (`http→ws`, `https→wss`); no extra env var (`src/lib/ENDPOINTS.ts`). No WS code runs when unconfigured — the query path degrades to polling, and with no API at all the buttons use local counts.
- `voter_key` is a stable per-browser UUID in `localStorage("availlo_voter_key")` (`getVoterKey()`).
- `Venue.tsx` passes the resolved `effectiveSlug` (detail slug, `undefined` for numeric-id rooms — check-ins need a slug).

## 3. Hook API

```ts
useCheckinsSocket(slug: string | undefined) => {
  counts: CheckinVotesResponse | undefined;  // { room, occupied, free, total, user_vote? }
  userVote: "occupied" | "free" | null;
  isLoading: boolean;
  isError: boolean;
  vote: (v: CheckinVote) => void;            // useMutation.mutate (optimistic)
  voteAsync: (v: CheckinVote) => Promise<...>;
  isVoting: boolean;
  voteError: unknown;
  socketStatus: "connecting" | "live" | "polling" | "closed";
  isLive: boolean;                            // socketStatus === "live"
}
```

`connectCheckinsSocket({ slug, onSnapshot, onStatusChange, maxRetries?, baseDelayMs? (1s), maxDelayMs? (30s), pingIntervalMs? (25s) }) => () => void` — status starts at `connecting`; each valid snapshot resets the backoff attempt counter; cleanup closes with code `1000` and cancels all timers/reconnects.

## 4. Reconnect + REST fallback strategy

1. Snapshot arrives with `live: true` → status `live`, polling disabled (`refetchInterval: false`).
2. Snapshot with `live: false` / close `1013` → status `polling`, REST polls every 12s, socket retries with backoff (1s→2s→4s… cap 30s + jitter).
3. Abnormal close → same backoff retry; UI badge shows “Updating”.
4. Close `4404` → status `closed`, no retry, no polling (bad slug).
5. Unmount / slug change → cleanup disconnects, discards group, clears ping + retry timers.

## 5. Checklist

- [x] `ENDPOINTS.checkins.{vote,votes,votesSocket}` + `WS_BASE_URL` derivation
- [x] Check-in types in `src/lib/api-types.ts`
- [x] `src/integrations/ws/checkins.ts` (validate, backoff, ping, 4404/1013 handling, `getVoterKey`)
- [x] `src/hooks/useCheckins.ts` (`useCheckinsSocket`: query + socket merge + mutation)
- [x] `CheckinStatusButtons` (occupied/free labels, share bar, Live/Updating badge, local fallback)
- [x] `Venue.tsx` passes `effectiveSlug`; old `CrowdsourceStatusButtons` removed
- [ ] Manual test vs running backend: connect, snapshot renders, POST from a second client moves both bars, kill Redis → “Updating” + 12s polling, unknown slug → no retry storm
- [ ] Backend follow-up (optional): `RoomDetail` serializer already embeds `votes` — could seed `["checkins", slug]` from detail and skip one GET
