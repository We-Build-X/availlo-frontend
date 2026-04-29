import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { MOCK_VENUES, type Venue } from "@/lib/mock-data";
import { FilterSidebar } from "@/components/explore/FilterSidebar";
import { VenueCard } from "@/components/VenueCard";
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

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setDrawerOpen(false);
  };

  const filteredVenues = MOCK_VENUES.filter((venue) => {
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
          <p className="mb-4 text-neutral-500 flex flex-col">
            <span className="text-sm">CLASSROOMS FOUND</span>
            <span className="text-2xl font-semibold">
              {filteredVenues.length} Available
            </span>{" "}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
