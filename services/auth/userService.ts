import { getSupabaseClient } from '@/services/supabase/client';
import type { User } from '@/types';

export async function upsertUserProfile(user: User): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const existing = await fetchUserProfile(user.id);
  const fullName =
    user.fullName.trim() && user.fullName !== 'Traveler'
      ? user.fullName
      : existing?.fullName && existing.fullName !== 'Traveler'
        ? existing.fullName
        : user.fullName;

  const { error } = await client.from('users').upsert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    avatar_url: user.avatarUrl,
  });
  if (error) throw error;
}

export async function fetchUserProfile(userId: string): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from('users').select('*').eq('id', userId).single();
  if (error) return null;

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name ?? 'Traveler',
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
}

export async function updateNotificationPrefs(
  userId: string,
  prefs: { pushNotifications: boolean; tripUpdates: boolean }
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client
    .from('users')
    .update({
      push_notifications: prefs.pushNotifications,
      trip_updates: prefs.tripUpdates,
    })
    .eq('id', userId);
  if (error) throw error;
}
