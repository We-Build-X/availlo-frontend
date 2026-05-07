import * as React from "react";
import { useState } from "react";
import { MOCK_OVERRIDES, type Override } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OverrideFormProps {
  onSubmit: (data: Omit<Override, "id">) => void;
  onCancel: () => void;
}

export function OverrideForm({ onSubmit, onCancel }: OverrideFormProps) {
  const [formData, setFormData] = useState({
    venueId: "",
    date: "",
    startTime: "",
    endTime: "",
    reason: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.venueId || !formData.date || !formData.startTime || !formData.endTime || !formData.reason) return;
    
    const selectedVenue = MOCK_OVERRIDES.find(v => v.venueId === formData.venueId);
    onSubmit({
      venueId: formData.venueId,
      venueName: selectedVenue?.venueName || "Unknown",
      building: selectedVenue?.building || "",
      faculty: "Unknown",
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      reason: formData.reason
    });
  };

  const uniqueVenues = Array.from(new Set(MOCK_OVERRIDES.map(v => JSON.stringify({ venueId: v.venueId, venueName: v.venueName, building: v.building })))).map(v => JSON.parse(v));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Venue</Label>
        <Select value={formData.venueId} onValueChange={(value) => setFormData({...formData, venueId: value})}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Select a venue" />
          </SelectTrigger>
          <SelectContent>
            {uniqueVenues.map((venue) => (
              <SelectItem key={venue.venueId} value={venue.venueId}>
                {venue.venueName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</Label>
        <Input 
          type="date" 
          value={formData.date} 
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Start Time</Label>
          <Input 
            type="time" 
            value={formData.startTime} 
            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End Time</Label>
          <Input 
            type="time" 
            value={formData.endTime} 
            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reason</Label>
        <Textarea 
          value={formData.reason} 
          onChange={(e) => setFormData({...formData, reason: e.target.value})}
          className="min-h-[100px] resize-none"
          placeholder="e.g., ACES Tech day, Maintenance, etc."
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} className="font-bold text-slate-600 hover:text-slate-900 px-4 sm:px-6 h-10 sm:h-11 order-2 sm:order-1 text-sm sm:text-base">
          Cancel
        </Button>
        <Button type="submit" className="text-white font-bold px-4 sm:px-6 h-10 sm:h-11 order-1 sm:order-2 text-sm sm:text-base">
          Save Changes
        </Button>
      </div>
    </form>
  );
}