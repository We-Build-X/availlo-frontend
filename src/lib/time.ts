import { parse, differenceInMinutes } from "date-fns"
import type { Venue } from "./mock-data"

// Helper to parse time strings like "4:00 PM" into a Date object for today
const parseTime = (timeString: string): Date => {
  return parse(timeString, "h:mm a", new Date())
}

export const getAvailabilityText = (
  availability: Venue["availability"],
): string => {
  const now = new Date()

  switch (availability.status) {
    case "FREE":
      if (availability.freeUntil) {
        return `Available until ${availability.freeUntil}`
      }
      return "Available"

    case "OCCUPIED":
      if (availability.nextAvailableTime) {
        return `Next free at ${availability.nextAvailableTime}`
      }
      return "Occupied"

    case "ENDING_SOON":
      if (availability.nextAvailableTime) {
        try {
          const nextAvailableDate = parseTime(availability.nextAvailableTime)
          const minutesUntilFree = differenceInMinutes(nextAvailableDate, now)

          if (minutesUntilFree <= 0) {
            return "Free now" // Or handle as newly free
          }
          return `Free in ${minutesUntilFree} min`
        } catch (e) {
          console.error("Error parsing time for 'ENDING_SOON':", e)
          return `Free soon` // Fallback
        }
      }
      return "Free soon"

    default:
      return "Status unknown"
  }
}
