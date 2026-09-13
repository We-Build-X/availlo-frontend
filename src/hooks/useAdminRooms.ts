import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/ENDPOINTS";
import type { AdminRoomPayload, PaginatedResponse } from "@/lib/api-types";

export function useAdminRooms(params: { search?: string; faculty?: string; page?: number }, enabled = true) {
  return useQuery({
    queryKey: ["admin", "rooms", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AdminRoomPayload>>(ENDPOINTS.admin.rooms, { params });
      return data;
    },
    enabled,
    staleTime: 15_000,
  });
}

export function useCreateAdminRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormData) => {
      const { data } = await api.post<AdminRoomPayload>(ENDPOINTS.admin.rooms, form);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "rooms"] }),
  });
}

export function useUpdateAdminRoom(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormData) => {
      const { data } = await api.patch<AdminRoomPayload>(ENDPOINTS.admin.roomDetail(slug), form);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "rooms"] }),
  });
}

export function useDeleteAdminRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      await api.delete(ENDPOINTS.admin.roomDetail(slug));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "rooms"] }),
  });
}

export function useAuthToken() {
  return useMutation({
    mutationFn: async (creds: { username: string; password: string }) => {
      const { data } = await api.post<{ token: string }>(ENDPOINTS.auth.token, creds);
      localStorage.setItem("availlo_token", data.token);
      return data;
    },
  });
}
