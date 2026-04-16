import type { Venue } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  LightbulbBolt,
  ClockCircle,
  UsersGroupRounded,
} from "@solar-icons/react";
import { ArrowRight } from "@solar-icons/react";
import { getAvailabilityText } from "@/lib/time";
import { Link } from "@tanstack/react-router";

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  const statusColors = {
    FREE: "bg-green-100 text-green-800",
    OCCUPIED: "bg-red-100 text-red-800",
    ENDING_SOON: "bg-yellow-100 text-yellow-800",
  };

  const statusText = {
    FREE: "FREE",
    OCCUPIED: "OCCUPIED",
    ENDING_SOON: "ENDING SOON",
  };

  return (
    <Card className="flex flex-col justify-between h-full border-2 border-border hover:shadow-[2px_2px_0px_0px_#ddd] shadow-none transition-shadow duration-300 ease-in-out">
      <CardHeader className="p-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-2xl font-bold uppercase tracking-wider">
            {venue.name}
          </CardTitle>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              statusColors[venue.availability.status]
            }`}
          >
            {statusText[venue.availability.status]}
          </span>
        </div>
        <CardDescription className="text-sm text-neutral-500 -mt-2">
          {venue.faculty} &bull; {venue.fullName}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0 -my-2">
        <div className="flex items-center text-neutral-600 mt-2">
          <LightbulbBolt
            className="mr-2 size-6"
            color={venue.hasPower ? "green" : ""}
          />
          <span className="font-medium">
            {venue.hasPower ? "Power Available" : "No Power"}
          </span>
        </div>
        <div className="flex items-center text-neutral-600 mt-2">
          <ClockCircle className="mr-2 size-5.5" />
          <span className="font-medium">
            {getAvailabilityText(venue.availability)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-0">
        <Link to="/venue/$id" params={{ id: venue.id }} className="w-full">
          <Button
            variant="outline"
            className="w-full cursor-pointer hover:bg-primary/10"
          >
            View Venue
            <ArrowRight className="ml-2 size-5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
