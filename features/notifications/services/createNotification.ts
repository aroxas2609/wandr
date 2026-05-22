import { getSupabaseClient } from '@/services/supabase/client';
import type { NotificationData, NotificationType } from '@/types';

export interface CreateNotificationInput {
  userId: string;
  tripId?: string;
  title: string;
  body?: string;
  type?: NotificationType;
  data?: NotificationData;
}

interface UserNotificationPrefs {
  push_notifications: boolean | null;
  trip_updates: boolean | null;
  expo_push_token: string | null;
}

export async function getUserNotificationPrefs(
  userId: string
): Promise<UserNotificationPrefs | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('users')
    .select('push_notifications, trip_updates, expo_push_token')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as UserNotificationPrefs;
}

/** Insert in-app notification row (always, unless caller skips). */
export async function createNotification(
  input: CreateNotificationInput
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('notifications')
    .insert({
      user_id: input.userId,
      trip_id: input.tripId ?? null,
      title: input.title,
      body: input.body ?? null,
      type: input.type ?? null,
      data: input.data ?? null,
      read: false,
    })
    .select('id')
    .single();
  if (error) throw error;
  return (data?.id as string) ?? null;
}

export function shouldSendPush(
  prefs: UserNotificationPrefs | null,
  type?: NotificationType
): boolean {
  if (!prefs?.push_notifications) return false;
  if (type === 'chat_message' || type === 'member_joined') {
    return prefs.trip_updates !== false;
  }
  return true;
}

/** Create in-app notification and dispatch Expo push when prefs allow. */
export async function notifyUser(input: CreateNotificationInput): Promise<void> {
  await createNotification(input);

  const prefs = await getUserNotificationPrefs(input.userId);
  if (!shouldSendPush(prefs, input.type) || !prefs?.expo_push_token) return;

  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.functions.invoke('dispatch-push', {
    body: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      data: input.data,
    },
  });
  if (error && __DEV__) {
    console.warn('[Wandr] dispatch-push:', error.message);
  }
}
