import { ArrowLeft } from "@solar-icons/react";
import { Link } from "@tanstack/react-router";

interface VenueHeroImageProps {
  image?: string;
  name: string;
}

export function VenueHeroImage({ image, name }: VenueHeroImageProps) {
  return (
    <div className="w-full relative h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
      <img
        src={image || "/placeholder.svg"}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      <div className="absolute bottom-5 md:bottom-10 left-4 md:left-10 md:left-20 text-white">
        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
          Venue View
        </span>
      </div>

      <Link
        to="/explore"
        className="absolute top-4 left-4 group md:hidden  inline-flex items-center gap-2.5 text-[11px] font-black uppercase text-black hover:text-slate-900 transition-all tracking-widest"
      >
        <div className="p-1.5 rounded-full border border-slate-100 bg-white group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
          <ArrowLeft className="size-5.5" />
        </div>
      </Link>
    </div>
  );
}
