const RAW_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
export const API_BASE_URL = RAW_BASE ? `${RAW_BASE.replace(/\/$/, "")}/api` : "";
// WebSocket base derived from the REST base: http -> ws, https -> wss.
export const WS_BASE_URL = RAW_BASE ? RAW_BASE.replace(/\/$/, "").replace(/^http/, "ws") : "";
export const isWsConfigured = () => WS_BASE_URL.length > 0;

export const ENDPOINTS = {
  health: `${API_BASE_URL}/health/`,
  rooms: {
    list: `${API_BASE_URL}/rooms/`,
    free: `${API_BASE_URL}/rooms/free/`,
    occupied: `${API_BASE_URL}/rooms/occupied/`,
    endingSoon: `${API_BASE_URL}/rooms/ending-soon/`,
    status: (roomId: number) => `${API_BASE_URL}/rooms/${roomId}/status/`,
    detail: (slug: string) => `${API_BASE_URL}/rooms/${slug}/`,
    timetable: (slug: string) => `${API_BASE_URL}/rooms/${slug}/timetable/`,
  },
  search: `${API_BASE_URL}/search/`,
  schema: `${API_BASE_URL}/schema/`,
  auth: {
    token: `${API_BASE_URL}/auth/token/`,
  },
  admin: {
    rooms: `${API_BASE_URL}/admin/rooms/`,
    roomDetail: (slug: string) => `${API_BASE_URL}/admin/rooms/${slug}/`,
  },
  timetable: {
    upload: `${API_BASE_URL}/timetable/upload/`,
  },
  checkins: {
    vote: (slug: string) => `${API_BASE_URL}/rooms/${slug}/vote/`,
    votes: (slug: string) => `${API_BASE_URL}/rooms/${slug}/votes/`,
    votesSocket: (slug: string) => `${WS_BASE_URL}/ws/rooms/${slug}/votes/`,
  },
} as const;
