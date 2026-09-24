export interface Building {
  id: number;
  name: string;
  code: string;
}

export interface Room {
  id: number;
  slug: string;
  name: string;
  building: Building | null;
  capacity: number | null;
  // Live status fields — merged into GET /api/rooms/ responses by the backend
  is_free: boolean | null;
  status: "FREE" | "OCCUPIED" | "ENDING_SOON" | null;
  current_session: SessionPayload | null;
  next_session: SessionPayload | null;
  free_until: string | null;
  next_available_time: string | null;
}

// Extended room shapes from backend

export interface SessionPayload {
  course_code: string;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  level: string | null;
  group: string | null;
}

export interface RoomStatusPayload {
  room: string;
  source: string;
  confidence_level: string;
  is_free: boolean;
  status: "FREE" | "OCCUPIED" | "ENDING_SOON";
  current_session: SessionPayload | null;
  next_session: SessionPayload | null;
  free_until: string | null;
  next_available_time: string | null;
}

export interface RoomDetail {
  id: number;
  slug: string;
  name: string;
  full_name: string;
  building: Building | null;
  faculty: string;
  capacity: number | null;
  has_power: boolean;
  image: string | null;
  status: "FREE" | "OCCUPIED" | "ENDING_SOON" | null;
  free_until: string | null;
  next_available_time: string | null;
}

export interface TimetableEntry {
  start_time: string;
  end_time: string;
  course_title: string | null;
  is_class: boolean;
}

export interface FreeRoom {
  id: number;
  slug: string;
  name: string;
  building: Building;
  capacity: number | null;
  next_session: SessionPayload | null;
}

export interface OccupiedRoom {
  id: number;
  slug: string;
  name: string;
  building: Building | null;
  capacity: number | null;
  current_session: SessionPayload | null;
}

export interface EndingSoonRoom {
  id: number;
  slug: string;
  name: string;
  building: string | null; // backend returns building name string here
  capacity: number | null;
  current_session: SessionPayload | null;
  minutes_until_free: number;
}

export interface SearchRoom extends Room {
  is_free?: boolean;
  next_session?: SessionPayload | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminRoomPayload {
  id: number;
  name: string;
  slug: string;
  full_name: string;
  faculty: string;
  building: Building | null;
  capacity: number | null;
  has_power: boolean;
  image: string | null;
}

export interface AdminRoomCreatePayload {
  name: string;
  building?: number | null;
  faculty?: string;
  capacity?: number | null;
  has_power?: boolean;
  image?: File | null;
}

export interface TimetableUploadRequest {
  file: File;
}

export interface TimetableUploadResponse {
  message: string;
  extracted_count: number;
  saved_count: number;
  skipped_count: number;
  semester: {
    id: number;
    name: string;
    is_active: boolean;
    created: string;
  };
  data: Record<string, unknown>[];
}

export interface TimetableUploadErrorResponse {
  error: string;
}

export interface TimetableUploadNotFoundResponse {
  error: string;
}

export interface AuthTokenResponse {
  token: string;
}

// Crowdsourced room check-ins (live via WebSocket, mutations via REST)

export type CheckinVote = "occupied" | "free";

export interface CheckinCounts {
  room: string;
  occupied: number;
  free: number;
  total: number;
}

export interface CheckinSnapshot extends CheckinCounts {
  live: boolean;
}

export interface CheckinVoteResponse extends CheckinCounts {
  user_vote: CheckinVote;
}

export interface CheckinVotesResponse extends CheckinCounts {
  user_vote?: CheckinVote | null;
}
