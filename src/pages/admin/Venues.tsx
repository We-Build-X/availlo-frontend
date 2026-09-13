import { useState, useMemo } from "react";
import { Search } from "@solar-icons/react/category";
import { Pen, TrashBin2 } from "@solar-icons/react";
import { MOCK_VENUES, type Venue } from "@/lib/mock-data";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VenueForm } from "@/components/admin/VenueForm";
import { isApiConfigured } from "@/lib/api";
import { useAdminRooms, useCreateAdminRoom, useUpdateAdminRoom, useDeleteAdminRoom } from "@/hooks/useAdminRooms";
import { useRooms } from "@/hooks/useRooms";
import { useDebounce } from "@/hooks/useDebounce";
import type { AdminRoomPayload } from "@/lib/api-types";

function adminToVenue(a: AdminRoomPayload): Venue {
  return {
    id: a.slug,
    name: a.name,
    fullName: a.full_name || a.building?.name || "",
    building: a.building?.code || "",
    faculty: (a.faculty as Venue["faculty"]) || "Engineering",
    type: "Classroom",
    capacity: a.capacity ?? 0,
    hasPower: a.has_power,
    image: a.image || undefined,
    amenities: [],
    availability: { status: "FREE" },
    schedule: [],
  };
}

export default function AdminVenues() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const useApi = isApiConfigured();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [facultyFilter, setFacultyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | undefined>(undefined);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("availlo_token"));

  // mock fallback state
  const [mockVenues, setMockVenues] = useState<Venue[]>(MOCK_VENUES);

  const adminQuery = useAdminRooms(
    {
      search: debouncedSearch || undefined,
      faculty: facultyFilter !== "all" ? facultyFilter : undefined,
      page,
    },
    useApi && !!token,
  );

  const { data: allRooms } = useRooms(useApi);
  const buildingMap = useMemo(() => {
    const m = new Map<string, number>();
    allRooms?.forEach((r) => {
      if (r.building) m.set(r.building.code.toUpperCase(), r.building.id);
    });
    adminQuery.data?.results.forEach((r) => {
      if (r.building) m.set(r.building.code.toUpperCase(), r.building.id);
    });
    return m;
  }, [allRooms, adminQuery.data]);

  const createMut = useCreateAdminRoom();
  const updateMut = useUpdateAdminRoom(editingSlug || "");
  const deleteMut = useDeleteAdminRoom();

  const venues: Venue[] = useApi && token && adminQuery.data
    ? adminQuery.data.results.map(adminToVenue)
    : mockVenues.filter((v) => {
        const matchesSearch =
          v.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          v.building.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesFaculty = facultyFilter === "all" || v.faculty === facultyFilter;
        return matchesSearch && matchesFaculty;
      });

  const totalCount = adminQuery.data?.count ?? venues.length;
  const totalPages = adminQuery.data ? Math.ceil(adminQuery.data.count / 10) : 1;

  const handleDelete = (id: string) => {
    setVenueToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!venueToDelete) return;
    if (useApi && token) {
      await deleteMut.mutateAsync(venueToDelete);
    } else {
      setMockVenues((prev) => prev.filter((v) => v.id !== venueToDelete));
    }
    setVenueToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setEditingSlug(venue.id);
    setOpen(true);
  };

  const handleAddNew = () => {
    setEditingVenue(undefined);
    setEditingSlug(null);
    setOpen(true);
  };

  const handleSubmit = async (
    data: Omit<Venue, "id" | "amenities" | "availability" | "schedule">,
    file: File | null,
  ) => {
    if (useApi && token) {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("full_name", data.fullName || data.name);
      fd.append("faculty", data.faculty);
      fd.append("capacity", String(data.capacity));
      fd.append("has_power", String(data.hasPower));
      // building: try resolve id, else skip (backend allows null)
      const bid = buildingMap.get(data.building.toUpperCase());
      if (bid) fd.append("building", String(bid));
      if (file) fd.append("image", file);
      try {
        if (editingSlug) {
          await updateMut.mutateAsync(fd);
        } else {
          await createMut.mutateAsync(fd);
        }
        setOpen(false);
        setEditingVenue(undefined);
        setEditingSlug(null);
      } catch (e) {
        console.error(e);
      }
      return;
    }
    // mock path
    if (editingVenue) {
      setMockVenues((prev) =>
        prev.map((v) =>
          v.id === editingVenue.id ? { ...v, ...data, image: data.image } : v,
        ),
      );
    } else {
      const newVenue: Venue = {
        ...data,
        id: Math.random().toString(36).slice(2, 9),
        amenities: [],
        availability: { status: "FREE" },
        schedule: [],
      };
      setMockVenues((prev) => [...prev, newVenue]);
    }
    setOpen(false);
    setEditingVenue(undefined);
  };

  const handleCancel = () => {
    setOpen(false);
    setEditingVenue(undefined);
    setEditingSlug(null);
  };

  const renderDeleteConfirm = () => {
    if (!deleteConfirmOpen) return null;
    return isDesktop ? (
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4"><p className="text-sm text-slate-500">Are you sure you want to delete this venue? This action cannot be undone.</p></div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="font-bold">Cancel</Button>
            <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    ) : (
      <Drawer open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DrawerContent className="border-0">
          <DrawerHeader><DialogTitle className="text-xl font-black text-slate-900">Confirm Delete</DialogTitle></DrawerHeader>
          <div className="px-4 py-4"><p className="text-sm text-slate-500">Are you sure you want to delete this venue?</p></div>
          <div className="flex flex-col gap-2 p-4">
            <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold w-full">Delete</Button>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="font-bold w-full">Cancel</Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-8 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-1 sm:mb-2">Venue Management</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Manage all available venues, classrooms, and halls.</p>
          </div>
          {isDesktop ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="text-white px-4 sm:px-6 font-bold h-10 sm:h-11 text-sm sm:text-base" onClick={handleAddNew}>+ Add Venue</Button></DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[600px] rounded-2xl border-0 max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-lg sm:text-xl font-black text-slate-900">{editingVenue ? "Edit Venue" : "Add Venue"}</DialogTitle></DialogHeader>
                <VenueForm initialData={editingVenue} onSubmit={handleSubmit} onCancel={handleCancel} isSaving={createMut.isPending || updateMut.isPending} />
                {(createMut.isError || updateMut.isError) && <p className="text-sm text-red-500 mt-2">Save failed. Check building code.</p>}
              </DialogContent>
            </Dialog>
          ) : (
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild><Button className="text-white w-full" onClick={handleAddNew}>+ Add Venue</Button></DrawerTrigger>
              <DrawerContent className="max-h-[90vh] border-0">
                <DrawerHeader className="text-left pb-0"><DialogTitle className="text-xl font-black text-slate-900">{editingVenue ? "Edit Venue" : "Add Venue"}</DialogTitle></DrawerHeader>
                <div className="px-4 pb-8 overflow-y-auto"><VenueForm initialData={editingVenue} onSubmit={handleSubmit} onCancel={handleCancel} isSaving={createMut.isPending || updateMut.isPending} /></div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow max-w-md">
            <Search.Magnifier className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <Input type="text" placeholder="Search venues..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="w-full pl-10 bg-white" />
          </div>
          <Select value={facultyFilter} onValueChange={(v) => { setFacultyFilter(v); setPage(1); }}>
            <SelectTrigger className="h-11 w-full md:w-auto bg-white"><SelectValue placeholder="Filter by faculty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Science">Science</SelectItem>
              <SelectItem value="Arts">Arts</SelectItem>
              <SelectItem value="Agriculture">Agriculture</SelectItem>
              <SelectItem value="Computing">Computing</SelectItem>
              <SelectItem value="Administration">Administration</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-2 sm:p-6 w-full overflow-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">Image</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">Venue Name</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">Building</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">Faculty</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">Capacity</TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminQuery.isPending && useApi && token ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center">Loading...</TableCell></TableRow>
              ) : (
                venues.map((venue) => (
                  <TableRow key={venue.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="py-4">
                      {venue.image ? <img src={venue.image} alt={venue.name} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">No img</div>}
                    </TableCell>
                    <TableCell className="py-4"><div className="font-bold text-slate-900">{venue.name}</div><div className="text-xs text-slate-400">{venue.fullName}</div></TableCell>
                    <TableCell className="py-4 text-sm text-slate-700">{venue.building}</TableCell>
                    <TableCell className="py-4 text-sm text-slate-700">{venue.faculty}</TableCell>
                    <TableCell className="py-4 text-sm font-medium text-slate-900">{venue.capacity}</TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(venue)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Pen size={16} /></button>
                        <button onClick={() => handleDelete(venue.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><TrashBin2 size={16} /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {venues.length === 0 && (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium">No venues found{debouncedSearch ? ` matching "${debouncedSearch}"` : ""}.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 flex items-center justify-center gap-4">
          <span>SHOWING {venues.length} OF {totalCount} VENUES</span>
          {totalPages > 1 && (
            <span className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <span className="py-1 text-slate-600">Page {page} / {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </span>
          )}
        </div>
      </div>
      {renderDeleteConfirm()}
    </div>
  );
}
