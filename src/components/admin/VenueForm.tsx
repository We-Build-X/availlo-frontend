import * as React from "react";
import { type Venue } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface VenueFormProps {
  initialData?: Venue;
  onSubmit: (data: Omit<Venue, "id" | "amenities" | "availability" | "schedule">) => void;
  onCancel: () => void;
}

export function VenueForm({ initialData, onSubmit, onCancel }: VenueFormProps) {
  const [formData, setFormData] = React.useState({
    name: initialData?.name || "",
    fullName: initialData?.fullName || "",
    building: initialData?.building || "",
    floor: initialData?.floor || "",
    type: initialData?.type || "" as Venue["type"],
    faculty: initialData?.faculty || "" as Venue["faculty"],
    capacity: initialData?.capacity?.toString() || "",
    hasPower: initialData?.hasPower ?? false,
    image: initialData?.image || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.building || !formData.type || !formData.faculty || !formData.capacity) {
      return;
    }

    onSubmit({
      name: formData.name,
      fullName: formData.fullName,
      building: formData.building,
      floor: formData.floor || undefined,
      type: formData.type,
      faculty: formData.faculty,
      capacity: parseInt(formData.capacity),
      hasPower: formData.hasPower,
      image: formData.image || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Image URL</Label>
        <Input 
          value={formData.image} 
          onChange={(e) => setFormData({...formData, image: e.target.value})}
          placeholder="/venue-image.jpg"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Venue Name</Label>
        <Input 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="e.g., NECB 101"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
        <Input 
          value={formData.fullName} 
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          placeholder="e.g., New Engineering Building"
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Building</Label>
          <Input 
            value={formData.building} 
            onChange={(e) => setFormData({...formData, building: e.target.value})}
            placeholder="e.g., NECB"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</Label>
          <Select value={formData.type} onValueChange={(value: Venue["type"]) => setFormData({...formData, type: value})}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hall">Hall</SelectItem>
              <SelectItem value="Lecture Theatre">Lecture Theatre</SelectItem>
              <SelectItem value="Classroom">Classroom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Floor (Optional)</Label>
          <Select value={formData.floor} onValueChange={(value) => setFormData({...formData, floor: value})}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ground">Ground</SelectItem>
              <SelectItem value="First">First</SelectItem>
              <SelectItem value="Second">Second</SelectItem>
              <SelectItem value="Third">Third</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Faculty</Label>
          <Select value={formData.faculty} onValueChange={(value: Venue["faculty"]) => setFormData({...formData, faculty: value})}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select faculty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Science">Science</SelectItem>
              <SelectItem value="Arts">Arts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Capacity</Label>
        <Input 
          type="number"
          value={formData.capacity} 
          onChange={(e) => setFormData({...formData, capacity: e.target.value})}
          placeholder="e.g., 50"
          className="h-11"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Has Power</Label>
        <Switch 
          checked={formData.hasPower} 
          onCheckedChange={(checked) => setFormData({...formData, hasPower: checked})}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} className="font-bold text-slate-600 hover:text-slate-900 px-4 sm:px-6 h-10 sm:h-11 order-2 sm:order-1 text-sm sm:text-base">
          Cancel
        </Button>
        <Button type="submit" className="text-white font-bold px-4 sm:px-6 h-10 sm:h-11 order-1 sm:order-2 text-sm sm:text-base">
          {initialData ? "Save" : "Add"}
        </Button>
      </div>
    </form>
  );
}
