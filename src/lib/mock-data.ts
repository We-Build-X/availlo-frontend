export interface Amenity {
  id: string;
  name: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isClass: boolean;
}

export interface Venue {
  id: string;
  name: string;
  fullName: string;
  building: string;
  floor?: string;
  type: "Hall" | "Lecture Theatre" | "Classroom";
  faculty: "Engineering" | "Science" | "Arts" | "Agriculture" | "Computing" | "Administration" | "Other";
  capacity: number;
  hasPower: boolean;
  image?: string;
  amenities: Amenity[];
  availability: {
    status: "FREE" | "OCCUPIED" | "ENDING_SOON";
    nextAvailableTime?: string;
    freeUntil?: string;
  };
  schedule: ScheduleItem[];
}

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  {
    id: "s1",
    title: "GST 121",
    startTime: "08:00 AM",
    endTime: "10:00 AM",
    isClass: true,
  },
  {
    id: "s3",
    title: "CPE321",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    isClass: true,
  },
  {
    id: "s2",
    title: "FREE",
    startTime: "12:00 PM",
    endTime: "02:00 PM",
    isClass: false,
  },
  {
    id: "s4",
    title: "FREE",
    startTime: "02:00 PM",
    endTime: "05:00 PM",
    isClass: false,
  },
  {
    id: "s5",
    title: "GST 121",
    startTime: "05:00 PM",
    endTime: "07:00 PM",
    isClass: true,
  },
  {
    id: "s6",
    title: "FREE",
    startTime: "07:00 PM",
    endTime: "10:00 PM",
    isClass: false,
  },
];

export const MOCK_VENUES: Venue[] = [
  {
    id: "1",
    name: "NECB 1",
    fullName: "New Engineering Building",
    building: "NECB",
    floor: "Ground",
    type: "Classroom",
    faculty: "Engineering",
    capacity: 50,
    hasPower: true,
    image: "/buildings/NECB.jpeg",
    amenities: [
      { id: "a1", name: "Projector" },
      { id: "a2", name: "Whiteboard" },
    ],
    availability: {
      status: "FREE",
      freeUntil: "4:00 PM",
    },
    schedule: DEFAULT_SCHEDULE,
  },
  {
    id: "2",
    name: "NECB 2",
    fullName: "New Engineering Building",
    building: "NECB",
    floor: "First",
    type: "Classroom",
    faculty: "Engineering",
    capacity: 30,
    hasPower: true,
    image: "/buildings/NECB.jpeg",
    amenities: [{ id: "a2", name: "Whiteboard" }],
    availability: {
      status: "ENDING_SOON",
      nextAvailableTime: "2:00 PM",
      freeUntil: "2:00 PM",
    },
    schedule: DEFAULT_SCHEDULE,
  },
  {
    id: "3",
    name: "SCI 101",
    fullName: "Science Building",
    building: "SCI",
    floor: "Ground",
    type: "Lecture Theatre",
    faculty: "Science",
    capacity: 100,
    hasPower: true,
    image: "/buildings/NECB.jpeg",
    amenities: [
      { id: "a1", name: "Projector" },
      { id: "a3", name: "Lab Equipment" },
    ],
    availability: {
      status: "OCCUPIED",
      nextAvailableTime: "3:00 PM",
    },
    schedule: DEFAULT_SCHEDULE,
  },
  {
    id: "4",
    name: "ARTS 2A",
    fullName: "Arts Building",
    building: "ARTS",
    floor: "Second",
    type: "Classroom",
    faculty: "Arts",
    capacity: 25,
    hasPower: false,
    image: "/buildings/NECB.jpeg",
    amenities: [{ id: "a4", name: "Piano" }],
    availability: {
      status: "FREE",
      freeUntil: "5:00 PM",
    },
    schedule: DEFAULT_SCHEDULE,
  },
  {
    id: "5",
    name: "NECB 3",
    fullName: "New Engineering Building",
    building: "NECB",
    floor: "Third",
    type: "Hall",
    faculty: "Engineering",
    capacity: 40,
    hasPower: true,
    image: "/buildings/NECB.jpeg",
    amenities: [{ id: "a1", name: "Projector" }],
    availability: {
      status: "FREE",
      freeUntil: "6:00 PM",
    },
    schedule: DEFAULT_SCHEDULE,
  },
];

export interface Override {
  id: string;
  venueId: string;
  venueName: string;
  building: string;
  faculty: string;
  reason: string;
  date: string; // ISO format or YYYY-MM-DD
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export const MOCK_OVERRIDES: Override[] = [
  {
    id: "1",
    venueId: "v1",
    venueName: "NECB 101",
    building: "Engineering Block",
    faculty: "Engineering",
    reason: "Guest Speaker Setup and Tech Rehearsal.",
    date: new Date().toISOString().split("T")[0], // Today
    startTime: "09:00",
    endTime: "11:30",
  },
  {
    id: "2",
    venueId: "v2",
    venueName: "ELF ",
    building: "ELF Hall",
    faculty: "Engineering",
    reason: "Guest Speaker Setup and Tech Rehearsal.",
    date: "2026-11-24", // Future Date (2026 Nov 24)
    startTime: "14:00",
    endTime: "16:00",
  },
  {
    id: "3",
    venueId: "v3",
    venueName: "ICT II",
    building: "ICT Building",
    faculty: "Computing",
    reason: "Guest Speaker Setup and Tech Rehearsal.",
    date: new Date().toISOString().split("T")[0], // Today
    startTime: "11:00",
    endTime: "13:00",
  },
  {
    id: "4",
    venueId: "v4",
    venueName: "OLD 101",
    building: "Old Block",
    faculty: "Science",
    reason: "Past event that should not be visible",
    date: "2020-01-01", // Past Date
    startTime: "10:00",
    endTime: "12:00",
  },
];
import type { Room, RoomDetail, SearchRoom } from "./api-types";

// Must cover every building.code the backend can return — anything missing
// here silently becomes "Engineering" and breaks faculty filtering.
const BUILDING_FACULTY_MAP: Record<string, Venue["faculty"]> = {
  ENG: "Engineering",
  NECB: "Engineering",
  NEB: "Engineering",
  CRFE: "Engineering",
  ELB: "Engineering",
  ELT: "Engineering",
  ELF: "Engineering",
  FL: "Engineering",
  ECB: "Engineering",
  PTDF: "Engineering",
  YBLD: "Engineering",
  WORKSHOP: "Engineering",
  "DRAWING STUDIO": "Engineering",
  LAB: "Engineering",
  "2 LABS": "Engineering",
  TED: "Engineering",
  "TED BLK UP": "Engineering",
  SCI: "Science",
  SLT: "Science",
  FSC: "Science",
  GEO: "Science",
  "GEO SC": "Science",
  "GEO SC1": "Science",
  GEOSCIENCE: "Science",
  PHYLAB: "Science",
  PHY: "Science",
  "NEW PHY": "Science",
  CHMLAB: "Science",
  CHM: "Science",
  "NEW CHM LAB": "Science",
  "MAT LAB": "Science",
  ARTS: "Arts",
  AGRIC: "Agriculture",
  AGRI: "Agriculture",
  ALT: "Agriculture",
  "AGRIC LT": "Agriculture",
  "AGRIC LT ICT II": "Agriculture",
  CMP: "Computing",
  COMP: "Computing",
  CSC: "Computing",
  ICT: "Computing",
  "ICT I": "Computing",
  "ICT II": "Computing",
  "600 C": "Computing",
  "600C": "Computing",
  "300 C": "Computing",
  "300C": "Computing",
  ADMIN: "Administration",
  ADM: "Administration",
  LIB: "Administration",
};

function inferFaculty(buildingCode: string): Venue["faculty"] {
  return BUILDING_FACULTY_MAP[buildingCode.toUpperCase()] ?? "Engineering";
}

function to24h(time: string | null | undefined): string | undefined {
  if (!time) return undefined;
  // backend gives HH:MM, frontend expects h:mm a for getAvailabilityText -> keep as-is for detail
  // Convert HH:MM to h:mm AM/PM for display compatibility
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function mapRoomToVenue(room: Room | SearchRoom): Venue {
  // GET /api/rooms/ now returns the live status merged into each record:
  // status ("FREE" | "OCCUPIED" | "ENDING_SOON"), free_until,
  // next_available_time and the session payloads. Use those directly.
  // Search results carry no status, only is_free — never default those to
  // FREE or users get sent to occupied rooms.
  const status: Venue["availability"]["status"] =
    room.status === "FREE" || room.status === "OCCUPIED" || room.status === "ENDING_SOON"
      ? room.status
      : room.is_free === false
        ? "OCCUPIED"
        : "FREE";
  return {
    // Prefer slug so cards link to /venue/<slug> (detail + timetable work).
    id: room.slug ?? String(room.id),
    name: room.name,
    fullName: room.building?.name ?? room.building?.code ?? "—",
    building: room.building?.code ?? "",
    type: "Classroom",
    faculty: room.building?.code ? inferFaculty(room.building.code) : "Engineering",
    capacity: room.capacity ?? 0,
    hasPower: true,
    amenities: [],
    availability: {
      status,
      freeUntil: room.free_until ? to24h(room.free_until) : undefined,
      nextAvailableTime: room.next_available_time ? to24h(room.next_available_time) : undefined,
    },
    schedule: [],
  };
}

export function mapRoomDetailToVenue(detail: RoomDetail): Venue {
  const status = detail.status ?? "FREE";
  return {
    id: detail.slug ?? String(detail.id),
    name: detail.name,
    fullName: detail.full_name || detail.building?.name || "",
    building: detail.building?.code ?? "",
    type: "Classroom",
    faculty: (detail.faculty as Venue["faculty"]) || inferFaculty(detail.building?.code ?? ""),
    capacity: detail.capacity ?? 0,
    hasPower: detail.has_power,
    image: detail.image ?? undefined,
    amenities: [],
    availability: {
      status,
      freeUntil: detail.free_until ? to24h(detail.free_until) : undefined,
      nextAvailableTime: detail.next_available_time ? to24h(detail.next_available_time) : undefined,
    },
    schedule: [],
  };
}

export interface MockReviewEntry {
  id: string;
  courseCode: string;
  day: string;
  time: string;
  venue: string;
  status: "VALID" | "CONFLICT" | "UNKNOWN_VENUE";
  conflictMessage?: string;
}

export const MOCK_REVIEW_ENTRIES: MockReviewEntry[] = [
  {
    id: "1",
    courseCode: "MEC 301",
    day: "Monday",
    time: "08:00 - 10:00",
    venue: "ELT 1",
    status: "VALID",
  },
  {
    id: "2",
    courseCode: "ELE 311",
    day: "Monday",
    time: "09:00 - 11:00",
    venue: "ELT 1",
    status: "CONFLICT",
    conflictMessage: "Overlaps with MEC 301 in same room.",
  },
  {
    id: "3",
    courseCode: "CVE 502",
    day: "Tuesday",
    time: "14:00 - 17:00",
    venue: "Old Lab",
    status: "UNKNOWN_VENUE",
    conflictMessage: "TBD (Main Hall?)",
  },
];
