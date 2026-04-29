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

export type TimetableStatus =
  | "ACTIVE"
  | "OUTDATED"
  | "NO_TIMETABLE"
  | "PENDING_REVIEW";

export interface FacultyTimetableStatus {
  id: string;
  facultyName: string;
  currentSemester: string;
  lastUploadedAt: string | null;
  status: TimetableStatus;
}

const now = new Date();

export const MOCK_FACULTY_STATUSES: FacultyTimetableStatus[] = [
  {
    id: "eng",
    facultyName: "Engineering",
    currentSemester: "2nd - 2025/2026",
    lastUploadedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
  },
  {
    id: "comp",
    facultyName: "Computing",
    currentSemester: "2nd - 2025/2026",
    lastUploadedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    status: "OUTDATED",
  },
  {
    id: "sci",
    facultyName: "Sciences",
    currentSemester: "2nd - 2025/2026",
    lastUploadedAt: null,
    status: "NO_TIMETABLE",
  },
  {
    id: "agri",
    facultyName: "Agriculture",
    currentSemester: "2nd - 2025/2026",
    lastUploadedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    status: "PENDING_REVIEW",
  },
  {
    id: "arts",
    facultyName: "Arts",
    currentSemester: "2nd - 2025/2026",
    lastUploadedAt: new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    status: "ACTIVE",
  },
];

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

export const MOCK_REVIEW_ENTRIES: any[] = [
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
  }
];
