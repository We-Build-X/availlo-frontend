import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "@tanstack/react-router";
import { MOCK_VENUES, mapRoomToVenue } from "@/lib/mock-data";
import { getAvailabilityText } from "@/lib/time";
import { VenueHeroImage } from "@/components/venue/VenueHeroImage";
import { UtilityStatus } from "@/components/venue/UtilityStatus";
import { CrowdsourceStatusButtons } from "@/components/venue/CrowdsourceStatusButtons";
import { RoomAmenitiesList } from "@/components/venue/RoomAmenitiesList";
import { DailyTimetable } from "@/components/venue/DailyTimetable";
import { ArrowLeft } from "@solar-icons/react";
import { api } from "@/lib/api";
import { API_BASE_URL, ENDPOINTS } from "@/lib/ENDPOINTS";
import type { Room } from "@/lib/api-types";
import { Skeleton } from "@/components/ui/skeleton";

const USE_API = !!API_BASE_URL;

export default function Venue() {
  const { id } = useParams({ from: "/public-layout/venue/$id" });

  const { data: apiVenue, isPending: venueLoading } = useQuery({
    queryKey: ["rooms", id],
    queryFn: async () => {
      const { data } = await api.get<Room>(ENDPOINTS.rooms.status(Number(id)));
      return mapRoomToVenue(data);
    },
    enabled: USE_API && !isNaN(Number(id)),
  });

  const isLoading = USE_API && venueLoading;
  const venue = USE_API ? apiVenue : MOCK_VENUES.find((v) => v.id === id);

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <Skeleton className="h-[300px] w-full rounded-none" />
        <div className="max-w-7xl mx-auto px-6 py-10 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-6">
                <Skeleton className="h-4 w-16" />
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div className="space-y-3">
                    <Skeleton className="h-14 w-64" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <Skeleton className="h-7 w-24 rounded-2xl" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
            <div className="hidden md:block lg:col-span-5">
              <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <h1 className="text-2xl font-black uppercase text-slate-900 mb-4">
          Venue not found
        </h1>
        <Link
          to="/explore"
          className="px-6 py-3 bg-primary text-white font-black uppercase tracking-wider rounded-xl transition-all hover:bg-slate-800 shadow-lg shadow-slate-200"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  const statusColors = {
    FREE: "bg-green-100 text-green-700 border-green-200 shadow-green-100/50",
    OCCUPIED: "bg-red-100 text-red-700 border-red-200 shadow-red-100/50",
    ENDING_SOON:
      "bg-yellow-100 text-yellow-700 border-yellow-200 shadow-yellow-100/50",
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Banner/Hero */}
      <div className="relative group overflow-hidden">
        <VenueHeroImage image={venue.image} name={venue.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
      </div>

      <div className="/max-w-7xl mx-auto px-6 py-10 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Details & Voting */}
          <div className="lg:col-span-7 space-y-12">
            {/* Header Info */}
            <div className="space-y-6">
              <Link
                to="/explore"
                className="group hidden  md:inline-flex items-center gap-2.5 text-[11px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all tracking-widest"
              >
                <div className="p-1.5 rounded-full border border-slate-100 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
                  <ArrowLeft className="size-5" />
                </div>
                Back
              </Link>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9]">
                    {venue.name}
                  </h1>
                  <p className="text-base md:text-lg font-bold text-slate-500 uppercase tracking-wide opacity-80">
                    {venue.fullName}
                  </p>
                </div>
                <div
                  className={`self-start px-4 py-1 rounded-2xl text-[11px] font-black uppercase border-2 shadow-lg ${statusColors[venue.availability.status]}`}
                >
                  {venue.availability.status.replace("_", " ")}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-black uppercase tracking-[0.1em] text-slate-400">
                <span className="flex items-center gap-2 hover:text-slate-900 transition-colors">
                  <div className="size-1 rounded-full bg-slate-200" />
                  {venue.floor} Floor
                </span>
                <span className="flex items-center gap-2 hover:text-slate-900 transition-colors">
                  <div className="size-1 rounded-full bg-slate-200" />
                  {venue.faculty}
                </span>
                <span className="flex items-center gap-2 text-blue-600">
                  <div className="size-1 rounded-full bg-blue-200" />
                  {getAvailabilityText(venue.availability)}
                </span>
              </div>
            </div>

            {/* Utility Status & Voting Grid */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-12">
              {/* Utility Status */}
              <div className="space-y-6">
                <UtilityStatus hasPower={venue.hasPower} />
              </div>

              <div className="md:hidden block ">
                <DailyTimetable schedule={venue.schedule} />
              </div>

              {/* Voting Section */}
              <div className="space-y-6">
                <CrowdsourceStatusButtons />
              </div>
            </div>

            {/* Amenities */}
            <div className="pt-4">
              <RoomAmenitiesList
                amenities={venue.amenities}
                capacity={venue.capacity}
              />
            </div>
          </div>

          {/* Right Column: Timetable (Sticky) */}
          <div className="hidden md:block lg:col-span-5 lg:sticky lg:top-32 pb-24">
            <DailyTimetable schedule={venue.schedule} />
          </div>
        </div>
      </div>
    </div>
  );
}
