import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  DocumentText,
  DangerCircle,
   ArrowLeft,
} from "@solar-icons/react";
import { Button } from "@/components/ui/button";

interface Step4FinishProps {
  facultyName: string;
}

export function Step4Finish({ facultyName }: Step4FinishProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Done! Timetable Published
        </h2>
        <p className="text-slate-500 mt-2">
          The schedule is now live and accessible to all faculty and students.
        </p>
      </div>

      <div className="w-full max-w-sm bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left">
        <h3 className="font-bold text-slate-900 mb-4 text-sm">
          Publish Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <DocumentText className="w-4 h-4" /> Total Entries
            </span>
            <span className="font-bold text-slate-900">342</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <DangerCircle className="w-4 h-4" /> Faculty
            </span>
            <span className="font-bold text-slate-900">{facultyName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Term
            </span>
            <span className="font-bold text-slate-900">Fall 2024</span>
          </div>
        </div>
      </div>

      <Button asChild size="lg" className="w-full sm:w-auto mt-4">
        <Link to="/admin/timetables">
           <ArrowLeft className="size-5" /> Return to Dashboard
        </Link>
      </Button>
    </div>
  );
}
