export interface Amenity {
  id: string
  name: string
}

export interface Venue {
  id: string
  name: string
  fullName: string
  building: string
  floor: string
  faculty: "Engineering" | "Science" | "Arts"
  capacity: number
  hasPower: boolean
  amenities: Amenity[]
  availability: {
    status: "FREE" | "OCCUPIED" | "ENDING_SOON"
    nextAvailableTime?: string
    freeUntil?: string
  }
}

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
    amenities: [
      { id: "a1", name: "Projector" },
      { id: "a2", name: "Whiteboard" },
    ],
    availability: {
      status: "FREE",
      freeUntil: "4:00 PM",
    },
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
    amenities: [{ id: "a2", name: "Whiteboard" }],
    availability: {
      status: "ENDING_SOON",
      freeUntil: "2:00 PM",
    },
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
    amenities: [
      { id: "a1", name: "Projector" },
      { id: "a3", name: "Lab Equipment" },
    ],
    availability: {
      status: "OCCUPIED",
      nextAvailableTime: "3:00 PM",
    },
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
    amenities: [{ id: "a4", name: "Piano" }],
    availability: {
      status: "FREE",
      freeUntil: "5:00 PM",
    },
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
    amenities: [{ id: "a1", name: "Projector" }],
    availability: {
      status: "FREE",
      freeUntil: "6:00 PM",
    },
  },
]
