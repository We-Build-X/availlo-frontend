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
  floor: string;
  faculty: "Engineering" | "Science" | "Arts";
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
    faculty: "Engineering",
    capacity: 50,
    hasPower: true,
    image: "/NECB.jpeg",
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
    faculty: "Engineering",
    capacity: 30,
    hasPower: true,
    image: "/NECB.jpeg",
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
    faculty: "Science",
    capacity: 100,
    hasPower: true,
    image: "/NECB.jpeg",
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
    faculty: "Arts",
    capacity: 25,
    hasPower: false,
    image: "/NECB.jpeg",
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
    faculty: "Engineering",
    capacity: 40,
    hasPower: true,
    image: "/NECB.jpeg",
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
