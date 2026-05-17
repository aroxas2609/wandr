export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface ItineraryDay {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string;
  notes?: string;
}

export interface Activity {
  id: string;
  dayId: string;
  title: string;
  timeSlot: TimeSlot;
  startTime?: string;
  endTime?: string;
  locationName?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  bookingUrl?: string;
  sortOrder: number;
}
