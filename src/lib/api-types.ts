export interface Building {
  id: number;
  name: string;
  code: string;
}

export interface Room {
  id: number;
  name: string;
  building: Building;
  capacity: number | null;
}

export interface TimetableUploadRequest {
  file: File;
  semester_id: number;
}

export interface TimetableUploadResponse {
  message: string;
  extracted_count: number;
  saved_count: number;
  skipped_count: number;
  data: Record<string, unknown>[];
}

export interface TimetableUploadErrorResponse {
  error: string;
}

export interface TimetableUploadNotFoundResponse {
  error: string;
}
