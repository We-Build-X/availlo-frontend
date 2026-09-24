export const LAST_TIMETABLE_UPLOAD_KEY = "availlo_last_timetable_upload"

export interface LastTimetableUpload {
  savedAt: string
  semester: string
  extracted_count: number
  saved_count: number
  skipped_count: number
}

export function readLastTimetableUpload(): LastTimetableUpload | null {
  try {
    const raw = localStorage.getItem(LAST_TIMETABLE_UPLOAD_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    const record = parsed as Partial<LastTimetableUpload>
    if (typeof record.semester !== "string") return null
    return {
      savedAt: typeof record.savedAt === "string" ? record.savedAt : "",
      semester: record.semester,
      extracted_count:
        typeof record.extracted_count === "number"
          ? record.extracted_count
          : 0,
      saved_count:
        typeof record.saved_count === "number" ? record.saved_count : 0,
      skipped_count:
        typeof record.skipped_count === "number" ? record.skipped_count : 0,
    }
  } catch {
    return null
  }
}
