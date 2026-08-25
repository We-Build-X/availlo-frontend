import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { MOCK_VENUES, mapRoomToVenue, type Venue } from "@/lib/mock-data";
import { FilterSidebar } from "@/components/explore/FilterSidebar";
import { VenueCard } from "#/components/VenueCard";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import Filter from "@solar-icons/react/ui/Filter";
import { Input } from "@/components/ui/input";
import { Search } from "@solar-icons/react/category";
import { MapPointSchool } from "@solar-icons/react";
import { api } from "@/lib/api";
import { API_BASE_URL, ENDPOINTS } from "@/lib/ENDPOINTS";
import type { Room } from "@/lib/api-types";
import { Skeleton } from "@/components/ui/skeleton";

const USE_API = !!API_BASE_URL;

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [filters, setFilters] = useState({
    faculty: "all",
    status: "all" as "all" | Venue["availability"]["status"],
    hasPower: false,
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const { data: apiRooms, isPending: roomsLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data } = await api.get<Room[]>(ENDPOINTS.rooms.list);
      return data.map(mapRoomToVenue);
    },
    enabled: USE_API && !debouncedSearchQuery,
    staleTime: 30_000,
  });

  const { data: searchResults, isPending: searchLoading } = useQuery({
    queryKey: ["rooms", "search", debouncedSearchQuery],
    queryFn: async () => {
      const { data } = await api.get<Room[]>(ENDPOINTS.search, {
        params: { q: debouncedSearchQuery },
      });
      return data.map(mapRoomToVenue);
    },
    enabled: USE_API && debouncedSearchQuery.length > 0,
    staleTime: 15_000,
  });

  const isLoading =
    USE_API && (debouncedSearchQuery ? searchLoading : roomsLoading);

  const rooms = !USE_API
    ? MOCK_VENUES
    : debouncedSearchQuery
      ? (searchResults ?? [])
      : (apiRooms ?? []);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setDrawerOpen(false);
  };

  const filteredVenues = rooms.filter((venue) => {
    const nameMatch =
      venue.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      venue.fullName.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const facultyMatch =
      appliedFilters.faculty === "all" ||
      venue.faculty === appliedFilters.faculty;
    const statusMatch =
      appliedFilters.status === "all" ||
      venue.availability.status === appliedFilters.status;
    const powerMatch = !appliedFilters.hasPower || venue.hasPower;
    return nameMatch && facultyMatch && statusMatch && powerMatch;
  });

  return (
    <div className="mx-auto px-4 py-8 md:p-10 ">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Find Space.</h1>
        <div className="flex gap-4">
          <div className="relative flex-grow max-w-4xl">
            <Search.Magnifier className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input
              placeholder="Search classrooms or buildings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-white!"
            />
          </div>
          <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <Filter size={20} />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filters</DrawerTitle>
              </DrawerHeader>
              <div className="p-4">
                <FilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  onApply={handleApplyFilters}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="bg-white p-6 rounded-xl hidden md:block md:col-span-1">
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
          />
        </aside>
        <main className="md:col-span-3">
          {!isLoading && (
            <p className="mb-6 text-right text-neutral-500">
              <span className="text-2xl font-semibold">
                {filteredVenues.length}
              </span>{" "}
              <span className="text-sm">spaces available</span>
            </p>
          )}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-2xl p-6 bg-white flex flex-col justify-between gap-8"
                >
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-52" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
              <MapPointSchool className="size-16 mb-4" />
              <p className="text-lg font-medium">No spaces found</p>
              <p className="text-sm">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
