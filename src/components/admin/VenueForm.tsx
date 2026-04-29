import * as React from "react";
import { type Venue } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload } from "@solar-icons/react";

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
  });
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialData?.image || null);

  // Handle image file selection
  React.useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Reset preview when initialData changes (for editing)
  React.useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(initialData?.image || null);
    }
  }, [initialData]);

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
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Venue Image</Label>
        {previewUrl ? (
          <div className="relative">
            <img src={previewUrl} alt="Venue preview" className="w-full h-32 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22L.5 11l5.78 5.78 1.06-1.06-4.47-4.47 4.47-4.47L6.28 5.22zm7.44 0l-1.06 1.06 4.47 4.47-4.47 4.47 1.06 1.06 5.78-5.78-5.78-5.78z" />
              </svg>
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload size={32} className="mb-4 text-slate-400" />
              <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-slate-400">PNG, JPG or JPEG (MAX. 800x400px)</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImageFile(file);
              }}
            />
          </label>
        )}
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
