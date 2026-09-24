import { useState } from "react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { Link } from "@tanstack/react-router"
import { CloudUpload, DocumentText } from "@solar-icons/react"
import { Button } from "@/components/ui/button"
import { readLastTimetableUpload } from "@/pages/admin/UploadWizard"

export default function AdminTimetables() {
  const [lastUpload] = useState(readLastTimetableUpload)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-1 sm:mb-2">
          Timetable Management
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500">
          Upload any timetable PDF. The semester is detected from the header and
          re-uploading the same semester replaces its sessions.
        </p>
      </div>

      {/* Upload entry */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
          <CloudUpload className="w-7 h-7 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900">Upload timetable PDF</h2>
          <p className="text-sm text-slate-500 mt-1">
            Extraction runs automatically after upload. Any faculty, any
            semester — one file at a time.
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link to="/admin/timetables/upload" search={{ step: 1 }}>
            Upload PDF
          </Link>
        </Button>
      </div>

      {/* Last upload summary (backend has no semester-list endpoint yet) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
        <h2 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">
          Last upload
        </h2>
        {lastUpload ? (
          <div className="space-y-3 max-w-md">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2">
                <DocumentText className="w-4 h-4" /> Semester
              </span>
              <span className="font-bold text-slate-900">
                {lastUpload.semester}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Saved sessions</span>
              <span className="font-bold text-slate-900">
                {lastUpload.saved_count}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Extracted / skipped</span>
              <span className="font-bold text-slate-900">
                {lastUpload.extracted_count} / {lastUpload.skipped_count}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Uploaded</span>
              <span className="font-bold text-slate-900">
                {formatDistanceToNow(parseISO(lastUpload.savedAt))} ago
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No timetable uploaded from this browser yet.
          </p>
        )}
      </div>
    </div>
  )
}
