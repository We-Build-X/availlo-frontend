import { useState, useEffect } from "react";
import { MOCK_VENUES, mapRoomToVenue, type Venue } from "@/lib/mock-data";
import { VenueCard } from "#/components/VenueCard"
import { isApiConfigured } from "@/lib/api";
import { useRooms } from "@/hooks/useRooms";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const USE_API = isApiConfigured();

// Faculties that can appear in live data (backend rooms list building codes,
// mapped to faculties in mock-data). Sorted for stable dropdown ordering.
const FACULTY_OPTIONS = [
  "ADMINISTRATION",
  "AGRICULTURE",
  "ARTS",
  "COMPUTING",
  "ENGINEERING",
  "SCIENCE",
  "OTHER",
];

export default function Home() {
  const [selectedFaculty, setSelectedFaculty] = useState("ALL");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedHourOffset, setSelectedHourOffset] = useState(0);

  const { data: rooms, isPending: roomsLoading } = useRooms(USE_API);

  const baseVenues: Venue[] =
    USE_API && rooms
      ? rooms.map(mapRoomToVenue)
      : USE_API
        ? []
        : MOCK_VENUES;

  // Helper function to determine the greeting
  function getGreeting(hour: number) {
    if (hour < 12) return "Good Morning!!";
    if (hour < 17) return "Good Afternoon!!";
    return "Good Evening!!";
  }

  // Update the time every minute so the clock stays accurate
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- TIMELINE LOGIC ---
  const currentHour = currentTime.getHours();
  const closingHour = 18; // 6:00 PM

  // Calculate slots left until 6 PM. (If it is past 6 PM, it defaults to 1 slot: "NOW")
  const slotsUntilClose = Math.max(1, closingHour - currentHour + 1);
  const timelineOffsets = Array.from({ length: slotsUntilClose }, (_, i) => i);

  const formatTimelineTime = (offset: number) => {
    if (offset === 0) return "NOW";
    const futureDate = new Date(currentTime);
    futureDate.setHours(currentTime.getHours() + offset);
    futureDate.setMinutes(0); // Snap to the top of the hour
    return futureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- FILTERING LOGIC ---
  // Filter by faculty
  let filteredVenues = baseVenues.filter(
    (v) => selectedFaculty === "ALL" || v.faculty.toUpperCase() === selectedFaculty
  );

  // The actual hour the user is looking at on the timeline
  const selectedHour = currentHour + selectedHourOffset;

  if (selectedHourOffset > 0) {
    filteredVenues = filteredVenues.map(venue => {
      let simulatedStatus = venue.availability.status;

      // "Ending Soon" venues become "Free" in future hours
      if (simulatedStatus === "ENDING_SOON") {
        simulatedStatus = "FREE";
      }

      // Check if the selected timeline hour exceeds when the venue stops being free
      if (venue.availability.freeUntil) {
        // Parse "4:00 PM" into an integer like 16
        const [timeMatch, modifier] = venue.availability.freeUntil.split(' ');
        let [hours] = timeMatch.split(':').map(Number);

        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        // If the hour we or the students are looking at is strictly greater than or equal to the freeUntil hour, 
        // the room is no longer free.
        if (selectedHour >= hours) {
          simulatedStatus = "OCCUPIED";
        }
      }

      return { ...venue, availability: { ...venue.availability, status: simulatedStatus } };
    });
  }

  // Group by status
  const freeVenues = filteredVenues.filter((v) => v.availability.status === "FREE");

  // Only show "Ending Soon" if we are looking at "NOW"
  const endingSoonVenues = selectedHourOffset === 0
    ? filteredVenues.filter((v) => v.availability.status === "ENDING_SOON")
    : [];

  const greeting = getGreeting(currentTime.getHours());
  const formattedCurrentTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isNowSelected = selectedHourOffset === 0;
  const activeTimeLabel = isNowSelected ? "NOW" : formatTimelineTime(selectedHourOffset);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 min-h-screen font-sans">

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 tracking-tight">
            {greeting}
          </h1>

          {/* Faculty Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">
              Current Faculty
            </span>
            <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
              <SelectTrigger className="w-fit border-none bg-gray-50 hover:bg-gray-100 rounded-lg h-8 px-3 font-bold text-xs text-gray-800 shadow-none">
                <SelectValue placeholder="Select Faculty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ALL FACULTIES</SelectItem>
                {FACULTY_OPTIONS.map((faculty) => (
                  <SelectItem key={faculty} value={faculty}>
                    {faculty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dynamic Time Display */}
        <div className="text-2xl font-bold text-gray-900 mt-2 uppercase hidden md:inline-flex">
          {formattedCurrentTime}
        </div>
      </div>

      {/* --- DYNAMIC TIMELINE --- */}
      <div className="flex gap-8 border-b-2 border-gray-100 pb-3.5 mb-10 font-bold overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {timelineOffsets.map((offset) => {
          const isSelected = selectedHourOffset === offset;
          return (
            <span
              key={offset}
              onClick={() => setSelectedHourOffset(offset)}
              className={`cursor-pointer transition-all duration-200 uppercase ${isSelected
                ? "text-gray-900 border-b-2 border-gray-900 pb-3 -mb-3.5 text-sm scale-105 origin-bottom"
                : "text-gray-400 hover:text-gray-600 text-xs"
                }`}
            >
              {formatTimelineTime(offset)}
            </span>
          );
        })}
      </div>

      {/* --- FREE NOW SECTION --- */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-sm font-extrabold tracking-widest text-gray-800 uppercase">
            FREE {activeTimeLabel}
          </h2>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {freeVenues.length} Spaces Available
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {USE_API && roomsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-2xl p-6 bg-white flex flex-col justify-between gap-8"
              >
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))
          ) : freeVenues.length > 0 ? (
            freeVenues.map((venue) => (
              <VenueCard key={`${venue.id}-${selectedHourOffset}`} venue={venue} />
            ))
          ) : (
            <p className="text-sm text-gray-400 font-medium col-span-full">
              No free spaces {activeTimeLabel.toLowerCase()} — try another hour or faculty.
            </p>
          )}
        </div>
      </div>

      {/* --- ENDING SOON SECTION --- */}
      {endingSoonVenues.length > 0 && (
        <div className="mb-12">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-sm font-extrabold tracking-widest text-gray-800 uppercase">
              Ending Soon
            </h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {endingSoonVenues.length} Spaces Opening Soon
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {endingSoonVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
