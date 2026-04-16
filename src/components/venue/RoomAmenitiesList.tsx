import {
  Monitor,
  Videocamera,
  UsersGroupTwoRounded,
  MusicNote,
  Pen,
  Hashtag,
} from "@solar-icons/react";
import type { Amenity } from "@/lib/mock-data";
import { Card } from "../ui/card";

interface RoomAmenitiesListProps {
  amenities: Amenity[];
  capacity: number;
}

export function RoomAmenitiesList({
  amenities,
  capacity,
}: RoomAmenitiesListProps) {
  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("projector") || n.includes("monitor"))
      return <Monitor size={18} />;
    if (n.includes("lab")) return <Videocamera size={18} />;
    if (n.includes("whiteboard") || n.includes("pen")) return <Pen size={18} />;
    if (n.includes("piano") || n.includes("music"))
      return <MusicNote size={18} />;
    return <Hashtag size={18} />;
  };

  return (
    <Card className="bg-slate-900 text-white gap-0 p-8 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <UsersGroupTwoRounded size={120} />
      </div>

      <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-slate-400">
        <span className="w-8 h-[1px] bg-slate-700" /> Room Amenities
      </h3>

      <div className="flex flex-wrap gap-3">
        <div className="group flex items-center gap-2.5 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-all">
          <UsersGroupTwoRounded size={20} className="text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {capacity} Capacity
          </span>
        </div>

        {amenities.map((amenity) => (
          <div
            key={amenity.id}
            className="group flex items-center gap-2.5 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-all"
          >
            <span className="text-slate-400 group-hover:text-white transition-colors">
              {getIcon(amenity.name)}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider">
              {amenity.name}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
