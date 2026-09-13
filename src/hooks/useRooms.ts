import { useQuery } from "@tanstack/react-query";
import { api, isApiConfigured } from "@/lib/api";
import { ENDPOINTS } from "@/lib/ENDPOINTS";
import type { Room, PaginatedResponse, SearchRoom, FreeRoom, OccupiedRoom, EndingSoonRoom } from "@/lib/api-types";

export function useRooms(enabled = isApiConfigured()) {
  return useQuery({
    queryKey: ["rooms", "list"],
    queryFn: async () => {
      const { data } = await api.get<Room[]>(ENDPOINTS.rooms.list);
      return data;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useFreeRooms(building?: string, page = 1, enabled = isApiConfigured()) {
  return useQuery({
    queryKey: ["rooms", "free", building, page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<FreeRoom>>(ENDPOINTS.rooms.free, {
        params: { building: building || undefined, page },
      });
      return data;
    },
    enabled,
    staleTime: 15_000,
  });
}

export function useSearchRooms(q: string, page = 1, enabled = isApiConfigured()) {
  return useQuery({
    queryKey: ["rooms", "search", q, page],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<SearchRoom>>(ENDPOINTS.search, {
        params: { q, page },
      });
      return data;
    },
    enabled: enabled && q.length > 0,
    staleTime: 15_000,
  });
}

export function useRoomDetail(slug: string, enabled = isApiConfigured()) {
  return useQuery({
    queryKey: ["rooms", "detail", slug],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.rooms.detail(slug));
      return data;
    },
    enabled: enabled && !!slug,
    staleTime: 15_000,
  });
}

export function useRoomTimetable(slug: string, date?: string, enabled = isApiConfigured()) {
  return useQuery({
    queryKey: ["rooms", "timetable", slug, date],
    queryFn: async () => {
      const { data } = await api.get(ENDPOINTS.rooms.timetable(slug), {
        params: date ? { date } : undefined,
      });
      return data;
    },
    enabled: enabled && !!slug,
    staleTime: 15_000,
  });
}

export function useOccupiedRooms(enabled = isApiConfigured()) {
  return useQuery({
    queryKey: ["rooms", "occupied"],
    queryFn: async () => {
      const { data } = await api.get<OccupiedRoom[]>(ENDPOINTS.rooms.occupied);
      return data;
    },
    enabled,
    staleTime: 15_000,
  });
}

export function useEndingSoonRooms(enabled = isApiConfigured()) {
  return useQuery({
    queryKey: ["rooms", "ending-soon"],
    queryFn: async () => {
      const { data } = await api.get<EndingSoonRoom[]>(ENDPOINTS.rooms.endingSoon);
      return data;
    },
    enabled,
    staleTime: 15_000,
  });
}
