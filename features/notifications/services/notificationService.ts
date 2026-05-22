import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import { getSupabaseClient } from '@/services/supabase/client';
import type { AppNotification, NotificationData } from '@/types';

function getLocalNotifications(): AppNotification[] {
  return getJson<AppNotification[]>(StorageKeys.notifications) ?? [];
}

function saveNotifications(items: AppNotification[]): void {
  setJson(StorageKeys.notifications, items);
}

function mapDbNotification(row: Record<string, unknown>): AppNotification {
  const rawData = row.data as NotificationData | null | undefined;
  return {
    id: row.id as string,
    userId: row.user_id as string,
    tripId: row.trip_id as string | undefined,
    title: row.title as string,
    body: row.body as string | undefined,
    type: row.type as AppNotification['type'],
    data: rawData ?? undefined,
    read: Boolean(row.read),
    createdAt: row.created_at as string,
  };
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const client = getSupabaseClient();
  if (!client) {
    return getLocalNotifications().filter((n) => n.userId === userId);
  }

  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const items = (data ?? []).map(mapDbNotification);
  saveNotifications(items);
  return items;
}

export async function markNotificationRead(id: string): Promise<void> {
  const items = getLocalNotifications();
  const index = items.findIndex((n) => n.id === id);
  if (index === -1) return;

  items[index] = { ...items[index], read: true };
  saveNotifications(items);

  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}
