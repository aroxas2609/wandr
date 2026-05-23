import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import { mapDbDay, mapDbTrip, mapDayToDb, mapTripToDb } from '@/lib/supabaseMappers';
import { getSupabaseClient, requireSupabaseClient } from '@/services/supabase/client';
import { uploadTripCover } from '@/services/storage/upload';
import { permissionDeniedError } from '@/lib/errors';
import { resolveMemberDisplayName } from '@/lib/memberDisplayName';
import { generateId } from '@/lib/ids';
import { generateDayDates } from '@/utils/dates';
import { getTripStatus } from '@/utils/dates';
import type { Trip, TripMember, ItineraryDay } from '@/types';
import type { TripFormData } from '../schemas/tripSchema';

function getLocalTrips(): Trip[] {
  return getJson<Trip[]>(StorageKeys.trips) ?? [];
}

function saveLocalTrips(trips: Trip[]): void {
  setJson(StorageKeys.trips, trips);
}

function getLocalDays(): ItineraryDay[] {
  return getJson<ItineraryDay[]>(StorageKeys.days) ?? [];
}

function saveLocalDays(days: ItineraryDay[]): void {
  setJson(StorageKeys.days, days);
}

function enrichTripStatus(trip: Trip): Trip {
  if (trip.status === 'archived') return trip;
  return { ...trip, status: getTripStatus(trip.startDate, trip.endDate) };
}

export async function fetchTrips(): Promise<Trip[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    return getLocalTrips().map(enrichTripStatus);
  }

  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;

  const { data, error } = await client
    .from('trips')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw error;

  const remote = (data ?? []).map(mapDbTrip);
  const local = getLocalTrips();

  if (remote.length === 0 && local.length > 0) {
    const ownedLocal = userId ? local.filter((t) => t.ownerId === userId) : local;
    if (ownedLocal.length > 0) {
      if (__DEV__) {
        console.warn(
          '[Wandr] Server returned no trips; showing local cache. Pull to refresh or sign in again.'
        );
      }
      return ownedLocal.map(enrichTripStatus);
    }
  }

  const remoteIds = new Set(remote.map((t) => t.id));
  const localOnly =
    userId != null
      ? local.filter((t) => t.ownerId === userId && !remoteIds.has(t.id))
      : [];

  const merged = [...remote, ...localOnly].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );
  const trips = merged.map(enrichTripStatus);
  saveLocalTrips(merged);
  return trips;
}

export async function fetchTrip(id: string): Promise<Trip | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from('trips').select('*').eq('id', id).single();
  if (error) throw error;
  return data ? enrichTripStatus(mapDbTrip(data)) : null;
}

async function resolveOwnerId(): Promise<string> {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('You must be signed in to create a trip');
  return data.user.id;
}

function isLocalCoverUri(uri: string): boolean {
  return (
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('blob:')
  );
}

function isRemoteCoverUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function parseBudgetTarget(value?: string): number | undefined {
  const trimmed = value?.trim() ?? '';
  if (trimmed === '' || trimmed === '.') return undefined;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Resolves cover for DB: uploads local picks, keeps https URLs, else default/existing. */
async function resolveCoverUrlForSave(
  form: TripFormData,
  tripId: string,
  ownerId: string,
  existingCoverUrl?: string
): Promise<string> {
  const raw = form.coverUrl?.trim();

  if (raw && isLocalCoverUri(raw)) {
    return uploadTripCover(ownerId, tripId, raw);
  }

  if (raw && isRemoteCoverUrl(raw)) {
    return raw;
  }

  if (existingCoverUrl && isRemoteCoverUrl(existingCoverUrl)) {
    return existingCoverUrl;
  }

  return getDefaultCover(form.destination);
}

export async function createTrip(form: TripFormData): Promise<Trip> {
  const resolvedOwnerId = await resolveOwnerId();
  const client = requireSupabaseClient();
  const now = new Date().toISOString();
  const trip: Trip = {
    id: generateId(),
    ownerId: resolvedOwnerId,
    title: form.title,
    destination: form.destination,
    coverUrl: getDefaultCover(form.destination),
    startDate: form.startDate,
    endDate: form.endDate,
    budgetTarget: parseBudgetTarget(form.budgetTarget),
    travelStyles: form.travelStyles ?? [],
    status: getTripStatus(form.startDate, form.endDate),
    createdAt: now,
    updatedAt: now,
  };

  const dayDates = generateDayDates(form.startDate, form.endDate);
  const days: ItineraryDay[] = dayDates.map((date, i) => ({
    id: generateId(),
    tripId: trip.id,
    dayNumber: i + 1,
    date,
  }));

  const { data, error } = await client.from('trips').insert(mapTripToDb(trip)).select().single();
  if (error) throw error;

  let created = mapDbTrip(data);

  try {
    const coverUrl = await resolveCoverUrlForSave(form, created.id, resolvedOwnerId);
    if (coverUrl !== created.coverUrl) {
      const { data: withCover, error: coverError } = await client
        .from('trips')
        .update({ cover_url: coverUrl })
        .eq('id', created.id)
        .select()
        .single();
      if (!coverError && withCover) {
        created = mapDbTrip(withCover);
      }
    }
  } catch (uploadErr) {
    if (__DEV__) {
      console.warn('[Wandr] Cover upload failed, using default:', uploadErr);
    }
  }

  const { error: daysError } = await client.from('itinerary_days').insert(days.map(mapDayToDb));
  if (daysError) throw daysError;

  const { error: ownerMemberError } = await client.from('trip_members').upsert({
    trip_id: created.id,
    user_id: resolvedOwnerId,
    role: 'owner',
  });
  if (ownerMemberError && __DEV__) {
    console.warn('[Wandr] Owner trip_members row:', ownerMemberError.message);
  }

  saveLocalTrips([...getLocalTrips().filter((t) => t.id !== created.id), created]);
  saveLocalDays([...getLocalDays(), ...days]);
  return enrichTripStatus(created);
}

export async function updateTrip(id: string, form: TripFormData): Promise<Trip> {
  const trips = getLocalTrips();
  const index = trips.findIndex((t) => t.id === id);
  if (index === -1) throw new Error('Trip not found');

  const existing = trips[index];
  let coverUrl = existing.coverUrl ?? getDefaultCover(form.destination);

  try {
    coverUrl = await resolveCoverUrlForSave(form, id, existing.ownerId, existing.coverUrl);
  } catch (uploadErr) {
    if (__DEV__) console.warn('[Wandr] Cover upload on update failed:', uploadErr);
    throw uploadErr;
  }

  const updated: Trip = {
    ...existing,
    title: form.title,
    destination: form.destination,
    coverUrl,
    startDate: form.startDate,
    endDate: form.endDate,
    budgetTarget: parseBudgetTarget(form.budgetTarget),
    travelStyles: form.travelStyles ?? [],
    status: getTripStatus(form.startDate, form.endDate),
    updatedAt: new Date().toISOString(),
  };

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('trips')
    .update(mapTripToDb(updated))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw permissionDeniedError('trip-save');
  const saved = enrichTripStatus(mapDbTrip(data));
  trips[index] = saved;
  saveLocalTrips(trips);
  return saved;
}

export async function deleteTrip(id: string): Promise<void> {
  const client = requireSupabaseClient();
  const { data, error } = await client.from('trips').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data?.length) throw permissionDeniedError('trip-delete');
  saveLocalTrips(getLocalTrips().filter((t) => t.id !== id));
  saveLocalDays(getLocalDays().filter((d) => d.tripId !== id));
}

export async function archiveTrip(id: string): Promise<Trip> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('trips')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw permissionDeniedError('trip-save');
  const saved = enrichTripStatus(mapDbTrip(data));
  const trips = getLocalTrips();
  const index = trips.findIndex((t) => t.id === id);
  if (index >= 0) {
    trips[index] = saved;
    saveLocalTrips(trips);
  }
  return saved;
}

export async function unarchiveTrip(id: string): Promise<Trip> {
  const trip = await fetchTrip(id);
  if (!trip) throw new Error('Trip not found');
  const nextStatus = getTripStatus(trip.startDate, trip.endDate);
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('trips')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw permissionDeniedError('trip-save');
  return enrichTripStatus(mapDbTrip(data));
}

export async function fetchTripMembers(tripId: string): Promise<TripMember[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('trip_members')
    .select('trip_id, user_id, role, users(full_name, avatar_url, email)')
    .eq('trip_id', tripId);
  if (error) throw error;

  const members: TripMember[] = (data ?? []).map((row) => {
    const users = row.users as { full_name?: string; avatar_url?: string; email?: string } | null;
    return {
      tripId: row.trip_id,
      userId: row.user_id,
      role: row.role as TripMember['role'],
      fullName: resolveMemberDisplayName({
        fullName: users?.full_name,
        email: users?.email,
      }),
      avatarUrl: users?.avatar_url,
      email: users?.email,
    };
  });

  const all = getJson<TripMember[]>(StorageKeys.members) ?? [];
  const others = all.filter((m) => m.tripId !== tripId);
  setJson(StorageKeys.members, [...others, ...members]);
  return members;
}

function getLocalDaysForTrip(tripId: string): ItineraryDay[] {
  return getLocalDays()
    .filter((d) => d.tripId === tripId)
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

export async function fetchTripDays(tripId: string): Promise<ItineraryDay[]> {
  const client = getSupabaseClient();
  if (!client) return getLocalDaysForTrip(tripId);

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    return getLocalDaysForTrip(tripId);
  }

  const { data, error } = await client
    .from('itinerary_days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number');
  if (error) throw error;

  const days = (data ?? []).map(mapDbDay);
  if (days.length > 0) {
    const allDays = getLocalDays().filter((d) => d.tripId !== tripId);
    saveLocalDays([...allDays, ...days]);
  }
  return days;
}

/** Creates itinerary days from trip dates when missing (e.g. legacy trips). */
export async function ensureTripDays(trip: Trip): Promise<ItineraryDay[]> {
  const existing = await fetchTripDays(trip.id);
  if (existing.length > 0) return existing;

  const dayDates = generateDayDates(trip.startDate, trip.endDate);
  if (dayDates.length === 0) return [];

  const days: ItineraryDay[] = dayDates.map((date, i) => ({
    id: generateId(),
    tripId: trip.id,
    dayNumber: i + 1,
    date,
  }));

  const client = requireSupabaseClient();
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    throw new Error('Sign in to open the day planner.');
  }

  const { error } = await client.from('itinerary_days').insert(days.map(mapDayToDb));
  if (error) throw error;

  saveLocalDays([...getLocalDays().filter((d) => d.tripId !== trip.id), ...days]);
  return days;
}

function getDefaultCover(destination: string): string {
  if (/paris/i.test(destination))
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800';
  if (/tokyo|japan/i.test(destination))
    return 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800';
  if (/iceland/i.test(destination))
    return 'https://images.unsplash.com/photo-1531168556467-80aace0d014f?w=800';
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';
}

export { getDefaultCover };
