import { Link } from "@tanstack/react-router";
import { CheckCircle, CloseCircle, ClockCircle, Buildings } from "@solar-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiConfigured } from "@/lib/api";
import { useRooms, useFreeRooms, useOccupiedRooms, useEndingSoonRooms } from "@/hooks/useRooms";
import { MOCK_VENUES } from "@/lib/mock-data";

const USE_API = isApiConfigured();

export default function AdminDashboard() {
  const { data: allRooms, isPending: roomsLoading } = useRooms(USE_API);
  const { data: freeData, isPending: freeLoading } = useFreeRooms(undefined, 1, USE_API);
  const { data: occupiedData, isPending: occupiedLoading } = useOccupiedRooms(USE_API);
  const { data: endingSoonData, isPending: endingLoading } = useEndingSoonRooms(USE_API);

  let total: number | null = null;
  let available: number | null = null;
  let occupied: number | null = null;
  let endingSoon: number | null = null;

  if (USE_API) {
    total = allRooms ? allRooms.length : null;
    available = freeData ? freeData.count : null;
    occupied = occupiedData ? occupiedData.length : null;
    endingSoon = endingSoonData ? endingSoonData.length : null;
  } else {
    total = MOCK_VENUES.length;
    available = MOCK_VENUES.filter((v) => v.availability.status === "FREE").length;
    occupied = MOCK_VENUES.filter((v) => v.availability.status === "OCCUPIED").length;
    endingSoon = MOCK_VENUES.filter((v) => v.availability.status === "ENDING_SOON").length;
  }

  const loading = USE_API && (roomsLoading || freeLoading || occupiedLoading || endingLoading);

  const cards = [
    {
      label: "Total Venues",
      value: total,
      hint: "All rooms on record",
      icon: Buildings,
      iconClass: "bg-slate-100 text-slate-600",
      link: "/admin/venues",
    },
    {
      label: "Available Now",
      value: available,
      hint: "Free at this moment",
      icon: CheckCircle,
      iconClass: "bg-green-50 text-green-600",
      link: "/explore",
    },
    {
      label: "Occupied Now",
      value: occupied,
      hint: "In session",
      icon: CloseCircle,
      iconClass: "bg-red-50 text-red-500",
      link: "/explore",
    },
    {
      label: "Ending Soon",
      value: endingSoon,
      hint: "Free within 15 min",
      icon: ClockCircle,
      iconClass: "bg-amber-50 text-amber-600",
      link: "/explore",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-8 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-1 sm:mb-2">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500">
          Live venue availability across campus.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.link}>
            <Card className="border border-slate-200 rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${card.iconClass}`}>
                    <card.icon size={22} />
                  </div>
                </div>
                {loading || card.value === null ? (
                  <Skeleton className="h-9 w-16 mb-2" />
                ) : (
                  <p className="text-3xl font-black text-slate-900 tabular-nums">{card.value}</p>
                )}
                <p className="text-sm font-bold text-slate-900 mt-1">{card.label}</p>
                <p className="text-xs text-slate-400 font-medium">{card.hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {USE_API && (freeData === undefined || occupiedData === undefined) && !loading && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Could not load live availability. Check that the backend is running and has an active semester.
        </p>
      )}
    </div>
  );
}
