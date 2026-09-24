import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import {
  MapPoint,
  MapPointSchool,
  ClockCircle,
  CloudUpload,
  ArrowLeft,
} from "@solar-icons/react";

const STEPS = [
  {
    icon: CloudUpload,
    title: "Timetables go in",
    body: "Class schedules are uploaded each semester and parsed into live sessions — course, time, level and venue.",
  },
  {
    icon: ClockCircle,
    title: "Availability comes out",
    body: "Every room resolves to Free, Ending soon or Occupied right now, with free-until and next-available times.",
  },
  {
    icon: MapPoint,
    title: "The campus lights up",
    body: "Buildings on the Uniuyo main-campus map take the worst-case colour of their rooms, so you can see where to head at a glance.",
  },
];

const STATUSES = [
  { label: "Free", color: "#10b981", body: "No class in session. Walk in." },
  { label: "Ending soon", color: "#f59e0b", body: "A session wraps up shortly — check the free-until time." },
  { label: "Occupied", color: "#ef4444", body: "Class in session. Pick another venue." },
  { label: "No data", color: "#9ca3af", body: "No timetable data for this venue yet." },
];

export default function About() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 animate-in fade-in slide-in-from-bottom-2">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => window.history.back()}>
        <ArrowLeft size={16} /> Back
      </Button>

      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex justify-center mb-5">
          <Logo />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
          Find your space.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-500 leading-relaxed">
          Availlo tells University of Uyo students which lecture venues are free
          right now — no more trekking across main campus to meet a locked hall
          or a class already in session.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/explore">Explore venues</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/map">
              <MapPointSchool size={18} /> Open campus map
            </Link>
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-14">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 text-center">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <s.icon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Step {i + 1}
              </p>
              <h3 className="mt-1 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status legend */}
      <div className="mt-14">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 text-center">
          Reading the colours
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATUSES.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <span
                className="inline-block h-3 w-3 rounded-full mb-2"
                style={{ backgroundColor: s.color }}
              />
              <h3 className="font-bold text-slate-900 text-sm">{s.label}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage */}
      <div className="mt-14 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center">
        <h2 className="font-bold text-slate-900">Uniuyo main campus, building by building</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Coverage starts with the main lecture venues — NECB, ELF/ELT, ICT blocks,
          the science theatres and labs — and grows every semester as new timetables
          are uploaded. Grey markers mean no data yet, not a closed venue.
        </p>
        <p className="mt-4 text-[11px] text-muted-foreground/60">
          Built for students, by students.
        </p>
      </div>
    </div>
  );
}
