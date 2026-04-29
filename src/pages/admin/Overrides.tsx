import * as React from "react";
import { useState } from "react";
import { format, isToday } from "date-fns";
import { MOCK_OVERRIDES, type Override } from "@/lib/mock-data";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OverrideForm } from "@/components/admin/OverrideForm";

function isOverrideActive(override: Override) {
  try {
    const endDateTime = new Date(`${override.date}T${override.endTime}:00`);
    return endDateTime > new Date();
  } catch (e) {
    return true;
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
    setOverrides(overrides.filter((o) => o.id !== id));
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
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-1 sm:mb-2">
            Overrides
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            Manage manual scheduling adjustments and temporary room blocks.
          </p>
        </div>
        
        {isDesktop ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="text-white px-4 sm:px-6 font-bold h-10 sm:h-11 text-sm sm:text-base">
                + Add override
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[600px] rounded-2xl border-0 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-black text-slate-900">
                  Add Override
                </DialogTitle>
              </DialogHeader>
              <OverrideForm
                onSubmit={handleAdd}
                onCancel={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button className="text-white w-full ">+ Add override</Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh]">
              <DrawerHeader className="text-left pb-0">
                <DrawerTitle className="text-xl font-black text-slate-900">
                  Add Override
                </DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-8 overflow-y-auto">
                <OverrideForm
                  onSubmit={handleAdd}
                  onCancel={() => setOpen(false)}
                />
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {/* Table Container matching Timetables style */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-2 sm:p-6 w-full">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">
                  Room ID
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">
                  Reason
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12">
                  Schedule
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-wider h-12 text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOverrides.map((override) => (
                <TableRow
                  key={override.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                >
                  <TableCell className="py-4 align-top">
                    <div className="font-bold text-slate-900">
                      {override.venueName}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {override.building}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 align-top">
                    <div className="text-sm font-medium text-slate-700">
                      {override.reason}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 align-top">
                    <div className="text-sm font-bold text-slate-900 mb-0.5">
                      {override.startTime} — {override.endTime}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {getDisplayDate(override.date)}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 align-top text-right">
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
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-slate-500 font-medium"
                  >
                    No active overrides found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {activeOverrides.length > 0 && (
          <div className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100">
            SHOWING {activeOverrides.length} ACTIVE RECORDS
          </div>
        )}
      </div>
    </div>
  );
}
