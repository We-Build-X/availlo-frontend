import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, isApiConfigured } from "@/lib/api"
import { ENDPOINTS, isWsConfigured } from "@/lib/ENDPOINTS"
import type {
  CheckinCounts,
  CheckinSnapshot,
  CheckinVote,
  CheckinVotesResponse,
} from "@/lib/api-types"
import { connectCheckinsSocket, getVoterKey } from "@/integrations/ws/checkins"
import type { CheckinsSocketStatus } from "@/integrations/ws/checkins"

export const CHECKINS_QUERY_KEY = (slug: string) => ["checkins", slug] as const
const FALLBACK_POLL_MS = 12_000

async function fetchVotes(slug: string): Promise<CheckinVotesResponse> {
  const { data } = await api.get<CheckinVotesResponse>(
    ENDPOINTS.checkins.votes(slug),
    {
      params: { voter_key: getVoterKey() },
    },
  )
  return data
}

async function postVote(slug: string, vote: CheckinVote) {
  const { data } = await api.post<CheckinVotesResponse>(
    ENDPOINTS.checkins.vote(slug),
    {
      vote,
      voter_key: getVoterKey(),
    },
  )
  return data
}

function applySnapshot(
  previous: CheckinVotesResponse | undefined,
  snapshot: CheckinSnapshot,
): CheckinVotesResponse {
  const counts: CheckinCounts = {
    room: snapshot.room,
    occupied: snapshot.occupied,
    free: snapshot.free,
    total: snapshot.total,
  }
  return { ...counts, user_vote: previous?.user_vote ?? null }
}

/**
 * Live check-in counts for a room.
 *
 * - Initial counts + the caller's vote come from GET /api/rooms/<slug>/votes/
 * - Every WS snapshot/broadcast is merged via queryClient.setQueryData
 * - REST polling (12s) covers degraded mode / closed sockets; disabled while live
 * - Votes are submitted with POST /api/rooms/<slug>/vote/ (WS is push-only)
 */
export function useCheckinsSocket(slug: string | undefined) {
  const queryClient = useQueryClient()
  const [socketStatus, setSocketStatus] =
    useState<CheckinsSocketStatus>("connecting")
  const enabled = isApiConfigured() && !!slug
  const key = CHECKINS_QUERY_KEY(slug ?? "")

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchVotes(slug!),
    enabled,
    staleTime: 10_000,
    // Live socket owns updates; poll only as fallback (backend suggests 10-15s).
    refetchInterval:
      enabled && socketStatus !== "live" && socketStatus !== "closed"
        ? FALLBACK_POLL_MS
        : false,
    retry: false,
  })

  useEffect(() => {
    if (!enabled || !slug || !isWsConfigured()) {
      if (!isWsConfigured()) setSocketStatus("polling")
      return
    }
    const disconnect = connectCheckinsSocket({
      slug,
      onSnapshot: (snapshot) => {
        queryClient.setQueryData<CheckinVotesResponse | undefined>(
          key,
          (previous) =>
            previous
              ? {
                  ...applySnapshot(previous, snapshot),
                  user_vote: previous.user_vote ?? null,
                }
              : { ...snapshot, user_vote: null },
        )
      },
      onStatusChange: (status) => setSocketStatus(status),
    })
    return disconnect
  }, [enabled, slug])

  const mutation = useMutation({
    mutationFn: (vote: CheckinVote) => postVote(slug!, vote),
    onMutate: async (vote) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<CheckinVotesResponse>(key)
      queryClient.setQueryData<CheckinVotesResponse | undefined>(key, (old) => {
        if (!old) return old
        const prevVote = old.user_vote
        if (prevVote === vote) return old
        const occupied =
          old.occupied +
          (vote === "occupied" ? 1 : 0) -
          (prevVote === "occupied" ? 1 : 0)
        const free =
          old.free + (vote === "free" ? 1 : 0) - (prevVote === "free" ? 1 : 0)
        return {
          ...old,
          occupied,
          free,
          total: occupied + free,
          user_vote: vote,
        }
      })
      return { previous }
    },
    onError: (_err, _vote, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSuccess: (data) => {
      // Authoritative counts; the WS broadcast echoing this vote converges to the same.
      queryClient.setQueryData<CheckinVotesResponse>(key, data)
    },
  })

  return {
    counts: query.data,
    userVote: query.data?.user_vote ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    vote: mutation.mutate,
    voteAsync: mutation.mutateAsync,
    isVoting: mutation.isPending,
    voteError: mutation.error,
    socketStatus,
    isLive: socketStatus === "live",
  }
}
