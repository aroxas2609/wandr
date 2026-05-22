import { resolveMemberDisplayName } from '@/lib/memberDisplayName';
import { getSupabaseClient } from '@/services/supabase/client';
import type { TripMessage } from '@/types';

const MESSAGE_SELECT_BASE =
  'id, trip_id, user_id, body, created_at, users(full_name, avatar_url, email)';

const MESSAGE_SELECT_WITH_UPDATED =
  'id, trip_id, user_id, body, created_at, updated_at, users(full_name, avatar_url, email)';

function isMissingUpdatedAtColumn(error: { message?: string } | null): boolean {
  return !!error?.message?.includes('updated_at');
}

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
    updatedAt: (row.updated_at as string | null) ?? undefined,
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

  const primary = await client
    .from('trip_messages')
    .select(MESSAGE_SELECT_WITH_UPDATED)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  const result = isMissingUpdatedAtColumn(primary.error)
    ? await client
        .from('trip_messages')
        .select(MESSAGE_SELECT_BASE)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
    : primary;

  if (result.error) throw result.error;

  return (result.data ?? []).map((row) => mapRow(row as Record<string, unknown>));
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

  let { data, error } = await client
    .from('trip_messages')
    .insert({
      trip_id: tripId,
      user_id: userId,
      body: trimmed,
    })
    .select(MESSAGE_SELECT_WITH_UPDATED)
    .single();

  if (isMissingUpdatedAtColumn(error)) {
    ({ data, error } = await client
      .from('trip_messages')
      .insert({
        trip_id: tripId,
        user_id: userId,
        body: trimmed,
      })
      .select(MESSAGE_SELECT_BASE)
      .single());
  }
  if (error) throw error;

  return mapRow(data as Record<string, unknown>);
}

export async function updateTripMessage(
  messageId: string,
  userId: string,
  body: string
): Promise<TripMessage> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Sign in to edit messages.');

  const trimmed = body.trim();
  if (!trimmed) throw new Error('Message cannot be empty.');

  let { data, error } = await client
    .from('trip_messages')
    .update({ body: trimmed, updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('user_id', userId)
    .select(MESSAGE_SELECT_WITH_UPDATED)
    .single();

  if (isMissingUpdatedAtColumn(error)) {
    ({ data, error } = await client
      .from('trip_messages')
      .update({ body: trimmed })
      .eq('id', messageId)
      .eq('user_id', userId)
      .select(MESSAGE_SELECT_BASE)
      .single());
  }
  if (error) throw error;

  return mapRow(data as Record<string, unknown>);
}

export async function deleteTripMessage(messageId: string, userId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Sign in to delete messages.');

  const { error } = await client
    .from('trip_messages')
    .delete()
    .eq('id', messageId)
    .eq('user_id', userId);
  if (error) throw error;
}
