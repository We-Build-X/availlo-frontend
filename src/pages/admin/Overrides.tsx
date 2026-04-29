import * as React from "react";
import { useState } from "react";
import { format, isToday } from "date-fns";
import { MOCK_OVERRIDES, type Override } from "@/lib/mock-data";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function isOverrideActive(override: Override) {
  try {
    const endDateTime = new Date(`${override.date}T${override.endTime}:00`);
    return endDateTime > new Date();
  } catch (e) {
    return true; // Fallback
  }
}

function getDisplayDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    return format(d, "MMM d");
  } catch (e) {
    return dateStr;
  }
}

export default function AdminOverrides() {
  const [overrides, setOverrides] = useState<Override[]>(MOCK_OVERRIDES);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);

  const activeOverrides = overrides.filter(isOverrideActive);

  const handleRemove = (id: string) => {
    setOverrides(overrides.filter(o => o.id !== id));
  };

  const handleAdd = (newOverride: Omit<Override, "id">) => {
    const override: Override = {
      ...newOverride,
      id: Math.random().toString(36).substr(2, 9),
    };
    setOverrides([...overrides, override]);
    setOpen(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 pt-4 sm:pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2">
            Overrides
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Manage manual scheduling adjustments and temporary room blocks.
          </p>
        </div>
        
        {isDesktop ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 font-bold h-11">
                + Add override
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-900">Add Overrides</DialogTitle>
              </DialogHeader>
              <OverrideForm onSubmit={handleAdd} onCancel={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full font-bold h-12 text-base">
                + Add override
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="text-left pb-0">
                <DrawerTitle className="text-xl font-black text-slate-900">Add Overrides</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-8">
                <OverrideForm onSubmit={handleAdd} onCancel={() => setOpen(false)} />
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white pt-6">
        <h2 className="text-base font-bold text-slate-900 mb-6">Active Overrides</h2>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[700px]">
            <Table className="border-0">
              <TableHeader>
                <TableRow className="border-0 bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 h-12 border-b border-slate-100 align-middle">ROOM ID</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 h-12 border-b border-slate-100 align-middle">REASON</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 h-12 border-b border-slate-100 align-middle">SCHEDULE</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 h-12 border-b border-slate-100 text-right align-middle pr-4">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border-0">
                {activeOverrides.map((override) => (
                  <TableRow 
                    key={override.id} 
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 transition-colors"
                  >
                    <TableCell className="py-5 align-top">
                      <div className="font-bold text-slate-900 text-sm mb-0.5">{override.venueName}</div>
                      <div className="text-xs text-slate-400 font-medium">{override.building}</div>
                    </TableCell>
                    <TableCell className="py-5 align-top">
                      <div className="text-sm font-medium text-slate-700 max-w-[300px]">
                        {override.reason}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 align-top">
                      <div className="text-sm font-bold text-slate-900 mb-0.5">
                        {override.startTime} — {override.endTime}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        {getDisplayDate(override.date)}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 align-top text-right pr-4">
                      <button 
                        onClick={() => handleRemove(override.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors hover:bg-red-50 py-1.5 px-3 rounded-md"
                      >
                        REMOVE
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {activeOverrides.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-500 font-medium border-b-0">
                      No active overrides found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {activeOverrides.length > 0 && (
          <div className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            SHOWING {activeOverrides.length} ACTIVE RECORDS
          </div>
        )}
      </div>
    </div>
  );
}

function OverrideForm({ onSubmit, onCancel }: { onSubmit: (data: Omit<Override, "id">) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    venueName: "NECB 3",
    building: "North Engineering Building (NECB)",
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "11:00",
    reason: "ACES Tech day"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      venueId: "new-v",
      faculty: "Unknown",
      ...formData
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Venue</Label>
          <Input 
            value={formData.venueName} 
            onChange={(e) => setFormData({...formData, venueName: e.target.value})}
            className="rounded-lg h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Building</Label>
          <Input 
            value={formData.building} 
            onChange={(e) => setFormData({...formData, building: e.target.value})}
            className="rounded-lg h-11"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</Label>
        <Input 
          type="date" 
          value={formData.date} 
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          className="rounded-lg h-11 block w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Start Time</Label>
          <Input 
            type="time" 
            value={formData.startTime} 
            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
            className="rounded-lg h-11 block w-full"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End Time</Label>
          <Input 
            type="time" 
            value={formData.endTime} 
            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
            className="rounded-lg h-11 block w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reason</Label>
        <Textarea 
          value={formData.reason} 
          onChange={(e) => setFormData({...formData, reason: e.target.value})}
          className="rounded-lg min-h-[100px] resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} className="font-bold text-slate-600 hover:text-slate-900 px-6 h-11 rounded-lg">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-11 rounded-lg">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
