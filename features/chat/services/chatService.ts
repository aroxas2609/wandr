import { resolveMemberDisplayName } from '@/lib/memberDisplayName';
import { getSupabaseClient } from '@/services/supabase/client';
import type { TripMessage } from '@/types';

function mapRow(row: Record<string, unknown>): TripMessage {
  const users = row.users as {
    full_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  } | null;

  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    userId: row.user_id as string,
    body: row.body as string,
    createdAt: row.created_at as string,
    authorName: resolveMemberDisplayName({
      fullName: users?.full_name,
      email: users?.email,
    }),
    authorAvatarUrl: users?.avatar_url ?? undefined,
  };
}

export async function fetchTripMessages(tripId: string): Promise<TripMessage[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('trip_messages')
    .select('id, trip_id, user_id, body, created_at, users(full_name, avatar_url, email)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function sendTripMessage(
  tripId: string,
  userId: string,
  body: string
): Promise<TripMessage> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Sign in to send messages.');

  const trimmed = body.trim();
  if (!trimmed) throw new Error('Message cannot be empty.');

  const { data, error } = await client
    .from('trip_messages')
    .insert({
      trip_id: tripId,
      user_id: userId,
      body: trimmed,
    })
    .select('id, trip_id, user_id, body, created_at, users(full_name, avatar_url, email)')
    .single();
  if (error) throw error;

  return mapRow(data as Record<string, unknown>);
}
