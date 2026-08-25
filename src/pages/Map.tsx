import { MapPoint } from "@solar-icons/react";

export default function Map() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <MapPoint className="size-20 text-neutral-300 mb-6" />
      <h1 className="text-3xl font-bold mb-2">Map View</h1>
      <p className="text-muted-foreground max-w-md">
        Find classrooms and buildings at a glance. This feature is coming soon.
      </p>
    </div>
  );
}
