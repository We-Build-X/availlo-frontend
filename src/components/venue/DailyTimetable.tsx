import type { ScheduleItem } from "@/lib/mock-data";
import { Calendar } from "@solar-icons/react/ssr";
import { Card } from "../ui/card";

interface DailyTimetableProps {
  schedule: ScheduleItem[];
}

export function DailyTimetable({ schedule }: DailyTimetableProps) {
  return (
    <Card className="space-y-8 bg-white p-0 md:p-8 rounded-none border-none md:border border-slate-200 ">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">
            Today's Timetable
          </p>
          <h2 className="text-2xl font-black capitalize tracking-tight text-slate-900 leading-none">
            Thursday, Oct 24
          </h2>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] font-black uppercase text-primary hover:text-blue-700 underline underline-offset-4 decoration-2 decoration-blue-200 hover:decoration-blue-600 transition-all"
        >
          <span>Weekly View </span>{" "}
          <Calendar weight="Linear" className="size-4.5" />
        </button>
      </div>

      <div className="relative space-y-6">
        {/* Timeline bar */}
        <div className="absolute left-[3px] top-4 bottom-4 w-[2px] bg-slate-100 rounded-full overflow-hidden">
          <div className="absolute top-0 w-full h-full bg-blue-500/10 rounded-full" />
        </div>

        {schedule.map((item) => (
          <div key={item.id} className="relative pl-8 group">
            {/* Timeline dot */}
            <div
              className={`absolute left-0 top-4 size-2 rounded-full border-2 border-white transition-all duration-300 ring-4 ring-transparent group-hover:ring-slate-100 ${
                item.isClass
                  ? "bg-slate-300 group-hover:bg-slate-900"
                  : "bg-blue-500 group-hover:scale-125"
              }`}
            />

            <div
              className={`flex flex-col relative sm:flex-row sm:items-center justify-between gap-4 p-5 border transition-all duration-300 ${
                item.isClass
                  ? "bg-slate-100 border-slate-100 hover:border-slate-200 border-l-5 border-l-primary hover:border-l-black opacity-75 hover:opacity-100"
                  : "bg-white border-blue-200 hover:border-blue-300 "
              }`}
            >
              {/* Start Time */}
              <span className="absolute top-0 font-bold text-xs bg-white -left-10">
                {item.startTime}
              </span>
              <div className="space-y-1">
                <h4
                  className={`text-base font-black uppercase tracking-wide ${
                    item.isClass ? "text-slate-600" : "text-primary"
                  }`}
                >
                  {item.title}
                </h4>
                <p className="text-sm font-bold text-slate-400 tabular-nums">
                  {item.startTime} — {item.endTime}
                </p>
              </div>

              {!item.isClass && (
                <div className="inline-flex w-fit items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase rounded-full border border-green-100 ring-4 ring-transparent group-hover:ring-green-50 transition-all">
                  <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                  Available
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
