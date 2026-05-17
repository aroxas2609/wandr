import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import { mapActivityToDb, mapDbActivity } from '@/lib/supabaseMappers';
import { getSupabaseClient } from '@/services/supabase/client';
import { generateId } from '@/lib/ids';
import { enqueue } from '@/services/sync/syncQueue';
import type { Activity, ItineraryDay } from '@/types';
import type { ActivityFormData } from '../schemas/activitySchema';

function getLocalActivities(): Activity[] {
  return getJson<Activity[]>(StorageKeys.activities) ?? [];
}

function saveLocalActivities(activities: Activity[]): void {
  setJson(StorageKeys.activities, activities);
}

export async function fetchActivitiesForDay(dayId: string): Promise<Activity[]> {
  const client = getSupabaseClient();
  if (!client) {
    return getLocalActivities()
      .filter((a) => a.dayId === dayId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const { data, error } = await client
    .from('activities')
    .select('*')
    .eq('day_id', dayId)
    .order('sort_order');
  if (error) throw error;
  const activities = (data ?? []).map(mapDbActivity);
  mergeActivitiesCache(activities);
  return getLocalActivities()
    .filter((a) => a.dayId === dayId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function fetchActivity(id: string): Promise<Activity | null> {
  const local = getLocalActivities().find((a) => a.id === id);
  if (local) return local;

  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from('activities').select('*').eq('id', id).single();
  if (error) throw error;
  if (!data) return null;
  const activity = mapDbActivity(data);
  mergeActivitiesCache([activity]);
  return activity;
}

export async function fetchActivitiesForTrip(
  days: ItineraryDay[]
): Promise<Activity[]> {
  const dayIds = days.map((d) => d.id);
  if (dayIds.length === 0) return [];

  const client = getSupabaseClient();
  if (!client) {
    return getLocalActivities()
      .filter((a) => dayIds.includes(a.dayId))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const { data, error } = await client
    .from('activities')
    .select('*')
    .in('day_id', dayIds)
    .order('sort_order');
  if (error) throw error;
  const activities = (data ?? []).map(mapDbActivity);
  mergeActivitiesCache(activities);
  return activities;
}

function mergeActivitiesCache(fetched: Activity[]): void {
  const existing = getLocalActivities();
  const ids = new Set(fetched.map((a) => a.id));
  const merged = [...existing.filter((a) => !ids.has(a.id)), ...fetched];
  saveLocalActivities(merged);
}

export async function createActivity(
  dayId: string,
  form: ActivityFormData
): Promise<Activity> {
  const existing = getLocalActivities().filter((a) => a.dayId === dayId);
  const activity: Activity = {
    id: generateId(),
    dayId,
    title: form.title,
    timeSlot: form.timeSlot,
    startTime: form.startTime,
    endTime: form.endTime,
    locationName: form.locationName,
    lat: form.lat,
    lng: form.lng,
    notes: form.notes,
    bookingUrl: form.bookingUrl || undefined,
    sortOrder: existing.length,
  };

  const activities = [...getLocalActivities(), activity];
  saveLocalActivities(activities);

  const client = getSupabaseClient();
  if (client) {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      saveLocalActivities(getLocalActivities().filter((a) => a.id !== activity.id));
      throw new Error('Sign in to add activities.');
    }
    const { error } = await client.from('activities').insert(mapActivityToDb(activity));
    if (error) {
      saveLocalActivities(getLocalActivities().filter((a) => a.id !== activity.id));
      throw error;
    }
  } else {
    enqueue('insert', 'activities', activity as unknown as Record<string, unknown>);
  }

  return activity;
}

export async function updateActivity(
  id: string,
  form: ActivityFormData
): Promise<Activity> {
  const activities = getLocalActivities();
  const index = activities.findIndex((a) => a.id === id);
  if (index === -1) throw new Error('Activity not found');

  const updated: Activity = {
    ...activities[index],
    title: form.title,
    timeSlot: form.timeSlot,
    startTime: form.startTime,
    endTime: form.endTime,
    locationName: form.locationName,
    lat: form.lat,
    lng: form.lng,
    notes: form.notes,
    bookingUrl: form.bookingUrl || undefined,
  };

  activities[index] = updated;
  saveLocalActivities(activities);

  const client = getSupabaseClient();
  if (client) {
    const { error } = await client
      .from('activities')
      .update(mapActivityToDb(updated))
      .eq('id', id);
    if (error) throw error;
  } else {
    enqueue('update', 'activities', updated as unknown as Record<string, unknown>);
  }

  return updated;
}

export async function deleteActivity(id: string): Promise<void> {
  saveLocalActivities(getLocalActivities().filter((a) => a.id !== id));

  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('activities').delete().eq('id', id);
    if (error) throw error;
  } else {
    enqueue('delete', 'activities', { id });
  }
}

export async function reorderActivity(
  id: string,
  direction: 'up' | 'down'
): Promise<Activity[]> {
  const activities = getLocalActivities();
  const activity = activities.find((a) => a.id === id);
  if (!activity) throw new Error('Activity not found');

  const dayActivities = activities
    .filter((a) => a.dayId === activity.dayId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const index = dayActivities.findIndex((a) => a.id === id);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= dayActivities.length) return dayActivities;

  const updated = [...dayActivities];
  [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
  const reordered = updated.map((a, i) => ({ ...a, sortOrder: i }));

  const otherActivities = activities.filter((a) => a.dayId !== activity.dayId);
  saveLocalActivities([...otherActivities, ...reordered]);

  const client = getSupabaseClient();
  if (client) {
    await Promise.all(
      reordered.map((a) =>
        client.from('activities').update({ sort_order: a.sortOrder }).eq('id', a.id)
      )
    );
  } else {
    for (const a of reordered) {
      enqueue('update', 'activities', a as unknown as Record<string, unknown>);
    }
  }

  return reordered;
}
