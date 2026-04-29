import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarMinimalistic,
  ClockCircle,
  MapPoint,
  Pen,
  DangerTriangle,
  CheckCircle,
} from "@solar-icons/react";
import { MOCK_REVIEW_ENTRIES } from "@/lib/mock-data";

interface Step3ReviewProps {
  onNext: () => void;
}

export function Step3Review({ onNext }: Step3ReviewProps) {
  const stats = { new: 12, removed: 4, conflicts: 2 };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">
          Review Changes
        </h2>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-green-50/50 border border-green-100 p-4 rounded-2xl">
            <div className="text-2xl font-black text-green-600">
              {stats.new}
            </div>
            <div className="text-xs font-bold text-green-800/60 uppercase tracking-wider mt-1">
              New
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <div className="text-2xl font-black text-slate-800">
              {stats.removed}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              Removed
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl relative overflow-hidden">
            <div className="absolute top-3 right-3 text-red-400">
              <DangerTriangle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-red-600">
              {stats.conflicts}
            </div>
            <div className="text-xs font-bold text-red-800/60 uppercase tracking-wider mt-1">
              Conflicts
            </div>
          </div>
        </div>

        <h3 className="font-bold text-slate-800 mb-4">
          Conflicts Requires Attention
        </h3>

        {/* Responsive Table View */}
        <div className="rounded-xl overflow-hidden overflow-x-auto w-full bg-slate-50/20">
          <div className="min-w-[700px]">
            <Table className="border-0">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 h-12 border-0">
                    Course
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 h-12 border-0">
                    Day
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 h-12 border-0">
                    Time
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 h-12 border-0">
                    Venue
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 text-right h-12 border-0">
                    Status
                  </TableHead>
                  <TableHead className="w-[50px] h-12 border-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border-0">
                {MOCK_REVIEW_ENTRIES.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className={`border-b border-white ${
                      entry.status === "VALID"
                        ? "bg-green-50/50 hover:bg-green-50/80"
                        : entry.status === "CONFLICT"
                          ? "bg-red-50/70 hover:bg-red-100/50"
                          : "bg-amber-50/50 hover:bg-amber-50/80"
                    }`}
                  >
                    <TableCell className="font-bold text-slate-900 py-3">
                      {entry.courseCode}
                      {entry.conflictMessage && (
                        <div
                          className={`text-xs mt-1 font-medium ${
                            entry.status === "CONFLICT"
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                        >
                          {entry.conflictMessage}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 py-3">
                      <div className="flex items-center gap-1.5">
                        <CalendarMinimalistic className="w-4 h-4 text-slate-400" />{" "}
                        {entry.day}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 py-3">
                      <div className="flex items-center gap-1.5">
                        <ClockCircle className="w-4 h-4 text-slate-400" />{" "}
                        {entry.time}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 py-3">
                      <div className="flex items-center gap-1.5">
                        <MapPoint className="w-4 h-4 text-slate-400" />{" "}
                        {entry.venue}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          entry.status === "VALID"
                            ? "text-green-600 border-green-200 bg-green-50"
                            : entry.status === "CONFLICT"
                              ? "text-red-600 border-red-200 bg-red-50"
                              : "text-amber-600 border-amber-200 bg-amber-50"
                        }`}
                      >
                        {entry.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <button
                        className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                        title="Edit Entry"
                      >
                        <Pen className="w-5 h-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button onClick={onNext} size="lg" className="w-full sm:w-auto">
          Publish Timetable <CheckCircle className="size-5" />
        </Button>
      </div>
    </div>
  );
}
