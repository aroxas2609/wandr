import type { Trip, ItineraryDay, Activity } from '@/types';
import { emptyToNull, numberToNull } from '@/lib/dbNullable';
import { parseDbTimeToForm } from '@/lib/timeInput';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbTrip(row: any): Trip {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    destination: row.destination,
    coverUrl: row.cover_url,
    startDate: row.start_date,
    endDate: row.end_date,
    budgetTarget: row.budget_target != null ? Number(row.budget_target) : undefined,
    travelStyles: row.travel_styles ?? [],
    status: row.status ?? 'upcoming',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTripToDb(trip: Partial<Trip> & { id: string }) {
  return {
    id: trip.id,
    owner_id: trip.ownerId,
    title: trip.title,
    destination: trip.destination,
    cover_url: trip.coverUrl,
    start_date: trip.startDate,
    end_date: trip.endDate,
    budget_target: numberToNull(trip.budgetTarget),
    travel_styles: trip.travelStyles,
    status: trip.status,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbDay(row: any): ItineraryDay {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayNumber: row.day_number,
    date: row.date,
    notes: row.notes,
  };
}

export function mapDayToDb(day: ItineraryDay) {
  return {
    id: day.id,
    trip_id: day.tripId,
    day_number: day.dayNumber,
    date: day.date,
    notes: day.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbActivity(row: any): Activity {
  return {
    id: row.id,
    dayId: row.day_id,
    title: row.title,
    timeSlot: row.time_slot,
    startTime: parseDbTimeToForm(row.start_time),
    endTime: parseDbTimeToForm(row.end_time),
    locationName: row.location_name ?? undefined,
    lat: row.lat != null ? Number(row.lat) : undefined,
    lng: row.lng != null ? Number(row.lng) : undefined,
    notes: row.notes,
    bookingUrl: row.booking_url,
    sortOrder: row.sort_order ?? 0,
  };
}

export function mapActivityToDb(activity: Partial<Activity> & { id: string; dayId: string }) {
  return {
    id: activity.id,
    day_id: activity.dayId,
    title: activity.title,
    time_slot: activity.timeSlot,
    start_time: emptyToNull(activity.startTime),
    end_time: emptyToNull(activity.endTime),
    location_name: emptyToNull(activity.locationName),
    lat: numberToNull(activity.lat),
    lng: numberToNull(activity.lng),
    notes: emptyToNull(activity.notes),
    booking_url: emptyToNull(activity.bookingUrl),
    sort_order: activity.sortOrder ?? 0,
  };
}

/** Convert sync queue camelCase payload to snake_case for a table */
export function payloadToDb(
  table: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const map: Record<string, string> = {
    ownerId: 'owner_id',
    coverUrl: 'cover_url',
    startDate: 'start_date',
    endDate: 'end_date',
    budgetTarget: 'budget_target',
    travelStyles: 'travel_styles',
    tripId: 'trip_id',
    dayNumber: 'day_number',
    dayId: 'day_id',
    timeSlot: 'time_slot',
    startTime: 'start_time',
    endTime: 'end_time',
    locationName: 'location_name',
    bookingUrl: 'booking_url',
    sortOrder: 'sort_order',
    userId: 'user_id',
    fileUrl: 'file_url',
    expiryDate: 'expiry_date',
    fullName: 'full_name',
    avatarUrl: 'avatar_url',
  };

  if (table === 'trips' || table === 'activities' || table === 'itinerary_days') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'createdAt' || key === 'updatedAt' || key === 'status') {
        if (table === 'trips' && key === 'status') out.status = value;
        continue;
      }
      out[map[key] ?? key] = value;
    }
    return out;
  }

  if (table === 'expenses' || table === 'packing_items' || table === 'travel_documents') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'createdAt') continue;
      out[map[key] ?? key] = value;
    }
    return out;
  }

  return payload;
}
