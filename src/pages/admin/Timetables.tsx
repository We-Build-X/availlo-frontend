import { useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Link } from "@tanstack/react-router";
import {
  MOCK_FACULTY_STATUSES,
  type TimetableStatus,
} from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  TimetableStatus,
  { label: string; action: string; className: string }
> = {
  ACTIVE: {
    label: "ACTIVE",
    action: "Manage",
    className: "bg-green-50 text-green-700 hover:bg-green-100",
  },
  OUTDATED: {
    label: "OUTDATED",
    action: "Update",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  PENDING_REVIEW: {
    label: "PENDING REVIEW",
    action: "Review",
    className: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  NO_TIMETABLE: {
    label: "NO TIMETABLE",
    action: "Upload",
    className: "bg-slate-100 text-slate-500 hover:bg-slate-200",
  },
};

export default function AdminTimetables() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaculties = MOCK_FACULTY_STATUSES.filter((f) =>
    f.facultyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
          Timetable Management
        </h1>
        <p className="text-sm font-medium text-slate-500">
          Review, upload, and publish faculty schedules across the institution.
        </p>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200  overflow-hidden">
        {/* Inner padding for the table to match design */}
        <div className="p-2 sm:p-6 w-full">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">
                  Faculty
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">
                  Semester
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">
                  Last Uploaded
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12 text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaculties.map((faculty) => {
                const config = STATUS_CONFIG[faculty.status];
                return (
                  <TableRow
                    key={faculty.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                  >
                    <TableCell className="py-4 font-bold text-slate-900">
                      {faculty.facultyName}
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-slate-500">
                      {faculty.currentSemester}
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-slate-500">
                      {faculty.lastUploadedAt
                        ? `${formatDistanceToNow(parseISO(faculty.lastUploadedAt))} ago`
                        : "—"}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${config.className}`}
                      >
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Link
                        to="/admin/timetables/upload/$id"
                        params={{ id: faculty.id }}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors px-3 py-2 -mr-3 rounded-lg hover:bg-blue-50"
                      >
                        {config.action}
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredFaculties.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-slate-500 font-medium"
                  >
                    No faculties found matching "{searchQuery}"
                  </TableCell>
                </TableRow>
              )}
              </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
