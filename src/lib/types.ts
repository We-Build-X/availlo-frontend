export interface TimetableEntry {
  id: string;
  courseCode: string;
  day: string;
  time: string;
  venue: string;
  status: 'VALID' | 'CONFLICT' | 'UNKNOWN_VENUE';
  conflictMessage?: string;
}

export interface ProcessingLog {
  id: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
}
