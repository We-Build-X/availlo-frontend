export const API_BASE_URL =
  `${import.meta.env.VITE_API_BASE_URL}/api` || "http://localhost:8000";

export const ENDPOINTS = {
  health: `${API_BASE_URL}/health/`,
  rooms: {
    list: `${API_BASE_URL}/rooms/`,
    status: (roomId: number) => `${API_BASE_URL}/rooms/${roomId}/status/`,
    free: `${API_BASE_URL}/rooms/free/`,
  },
  search: `${API_BASE_URL}/search/`,
  schema: `${API_BASE_URL}/schema/`,
  timetable: {
    upload: `${API_BASE_URL}/timetable/upload/`,
  },
} as const;
