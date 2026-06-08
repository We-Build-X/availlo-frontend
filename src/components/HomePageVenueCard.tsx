import type { Venue } from "@/lib/mock-data";
import { getAvailabilityText } from "@/lib/time";
import { Link } from "@tanstack/react-router";

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  // Matching Figma's exact soft badge colors
  const statusColors = {
    FREE: "bg-green-50 text-green-500",
    OCCUPIED: "bg-red-50 text-red-500",
    ENDING_SOON: "bg-orange-50 text-orange-400",
  };

  const statusText = {
    FREE: "FREE",
    OCCUPIED: "OCCUPIED",
    ENDING_SOON: "ENDING SOON",
  };

  // The text at the bottom changes color based on status
  const bottomTextColor = {
    FREE: "text-green-600",
    OCCUPIED: "text-red-600",
    ENDING_SOON: "text-orange-600", 
  };

  return (
    <Link to="/venue/$id" params={{ id: venue.id }} className="block h-full">
      <div className="border border-gray-200 rounded-2xl p-6 bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.05)] transition-all duration-200 cursor-pointer flex flex-col h-full justify-between gap-8">
        
        {/* Top Half: Name & Status */}
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            {venue.name}
          </h3>
          <span
            className={`px-3 py-1 rounded-md text-[10px] font-extrabold tracking-widest uppercase ${
              statusColors[venue.availability.status]
            }`}
          >
            {statusText[venue.availability.status]}
          </span>
        </div>

        {/* Bottom Half: Details & Timing */}
        <div>
          <div className="mb-3">
            <p className="text-sm font-bold text-gray-700">{venue.fullName}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              {venue.floor || "Ground"} Floor &bull; {venue.capacity} Seats
            </p>
          </div>

          <div>
            <span className={`text-xs font-bold ${bottomTextColor[venue.availability.status]}`}>
              {getAvailabilityText(venue.availability)}
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
}