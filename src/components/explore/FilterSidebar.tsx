import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Venue } from "@/lib/mock-data"

const statusColors: Record<Venue["availability"]["status"], string> = {
  FREE: "bg-green-100 text-green-800",
  OCCUPIED: "bg-red-100 text-red-800",
  ENDING_SOON: "bg-yellow-100 text-yellow-800",
}

interface FilterSidebarProps {
  filters: {
    faculty: string
    status: "all" | Venue["availability"]["status"]
    hasPower: boolean
  }
  setFilters: (filters: FilterSidebarProps["filters"]) => void
  onApply: () => void
}

export function FilterSidebar({
  filters,
  setFilters,
  onApply,
}: FilterSidebarProps) {
  const handleFacultyChange = (value: string) => {
    setFilters({ ...filters, faculty: value })
  }

  const handleStatusChange = (
    value: "all" | Venue["availability"]["status"],
  ) => {
    setFilters({ ...filters, status: value })
  }

  const handleHasPowerChange = (checked: boolean) => {
    setFilters({ ...filters, hasPower: checked })
  }

  return (
    <div className="space-y-6">
      <div>
        <Label>Faculty</Label>
        <Select value={filters.faculty} onValueChange={handleFacultyChange}>
          <SelectTrigger className="mt-2 w-full">
            <SelectValue placeholder="All faculties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All faculties</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Science">Science</SelectItem>
            <SelectItem value="Arts">Arts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Status</Label>
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="mt-2 w-full">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {(["FREE", "OCCUPIED", "ENDING_SOON"] as const).map((status) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[status]}`}
                  >
                    {status.replace("_", " ")}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-power"
            checked={filters.hasPower}
            onCheckedChange={handleHasPowerChange}
          />
          <Label htmlFor="has-power">Has electricity</Label>
        </div>
      </div>

      <Button className="w-full" onClick={onApply}>
        Apply Filters
      </Button>
    </div>
  )
}
