import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import { getErrorMessage } from '@/lib/errors';
import { resolveMemberDisplayName } from '@/lib/memberDisplayName';
import { getSupabaseClient, requireSupabaseClient } from '@/services/supabase/client';
import { fetchTrip, fetchTripMembers as fetchTripMembersBase } from '@/features/trips/services/tripService';
import type { TripMember } from '@/types';

function generateToken(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

interface InviteUserLookup {
  id?: string;
  user_id?: string;
  full_name?: string | null;
  email?: string;
}

async function lookupUserByEmail(normalizedEmail: string): Promise<InviteUserLookup | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.rpc('find_user_by_email', {
    lookup_email: normalizedEmail,
  });

  if (error) {
    if (
      error.message.includes('find_user_by_email') ||
      error.code === 'PGRST202' ||
      error.code === '42883'
    ) {
      throw new Error(
        'Run supabase/invite_user_lookup.sql in your Supabase SQL editor, then try again.'
      );
    }
    throw new Error(getErrorMessage(error, 'Could not look up user by email.'));
  }

  const row = (Array.isArray(data) ? data[0] : data) as InviteUserLookup | undefined;
  const userId = row?.user_id ?? row?.id;
  return userId ? { ...row, id: userId } : null;
}

interface PendingInviteRow {
  id: string;
  trip_id: string;
  email: string;
  role: string;
  invite_token: string;
}

function getLocalPendingInvites(tripId: string): TripMember[] {
  const all = getJson<Record<string, TripMember[]>>(StorageKeys.tripInvites) ?? {};
  return all[tripId] ?? [];
}

function saveLocalPendingInvites(tripId: string, invites: TripMember[]): void {
  const all = getJson<Record<string, TripMember[]>>(StorageKeys.tripInvites) ?? {};
  all[tripId] = invites;
  setJson(StorageKeys.tripInvites, all);
}

async function fetchPendingInvites(tripId: string): Promise<TripMember[]> {
  const client = getSupabaseClient();
  if (!client) return getLocalPendingInvites(tripId);

  const { data, error } = await client
    .from('trip_invites')
    .select('id, trip_id, email, role, invite_token')
    .eq('trip_id', tripId);
  if (error) {
    if (__DEV__) console.warn('[Wandr] trip_invites fetch:', error.message);
    return [];
  }

  return (data ?? []).map((row: PendingInviteRow) => ({
    tripId: row.trip_id,
    userId: `pending-${row.id}`,
    role: row.role as TripMember['role'],
    fullName: row.email,
    email: row.email,
    inviteToken: row.invite_token,
    status: 'pending',
  }));
}

/** Owner + active members + pending invites */
export async function fetchTripMembersWithOwner(tripId: string): Promise<TripMember[]> {
  const trip = await fetchTrip(tripId);
  const active = await fetchTripMembersBase(tripId);
  const pending = await fetchPendingInvites(tripId);

  const merged: TripMember[] = [];

  if (trip) {
    const ownerInList = active.some((m) => m.userId === trip.ownerId);
    if (!ownerInList) {
      const client = getSupabaseClient();
      let ownerName = 'You';
      let ownerEmail: string | undefined;
      let ownerAvatarUrl: string | undefined;
      if (client) {
        const { data } = await client
          .from('users')
          .select('full_name, email, avatar_url')
          .eq('id', trip.ownerId)
          .single();
        ownerEmail = data?.email ?? undefined;
        ownerAvatarUrl = data?.avatar_url ?? undefined;
        ownerName = resolveMemberDisplayName({
          fullName: data?.full_name,
          email: ownerEmail,
        });
      }
      merged.push({
        tripId,
        userId: trip.ownerId,
        role: 'owner',
        fullName: ownerName,
        email: ownerEmail,
        avatarUrl: ownerAvatarUrl,
        status: 'active',
      });
    }
  }

  for (const m of active) {
    merged.push({ ...m, status: 'active' });
  }

  for (const p of pending) {
    if (!merged.some((m) => m.email?.toLowerCase() === p.email?.toLowerCase())) {
      merged.push(p);
    }
  }

  return merged;
}

export async function ensureOwnerMembership(tripId: string, ownerId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from('trip_members').upsert({
    trip_id: tripId,
    user_id: ownerId,
    role: 'owner',
  });
  if (error && __DEV__) {
    console.warn('[Wandr] ensureOwnerMembership:', error.message);
  }
}

export async function inviteMemberByEmail(
  tripId: string,
  email: string,
  role: 'editor' | 'viewer' = 'viewer',
  invitedBy?: string
): Promise<{ inviteToken: string; addedToTrip: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  const inviteToken = generateToken();

  const client = requireSupabaseClient();

  const userRow = await lookupUserByEmail(normalizedEmail);

  if (userRow?.id) {
    const { error } = await client.from('trip_members').upsert(
      {
        trip_id: tripId,
        user_id: userRow.id,
        role,
      },
      { onConflict: 'trip_id,user_id' }
    );
    if (error) {
      throw new Error(getErrorMessage(error, 'Could not add member to trip.'));
    }

    await client.from('trip_invites').delete().eq('trip_id', tripId).eq('email', normalizedEmail);

    const pending = getLocalPendingInvites(tripId);
    if (pending.some((p) => p.email?.toLowerCase() === normalizedEmail)) {
      saveLocalPendingInvites(
        tripId,
        pending.filter((p) => p.email?.toLowerCase() !== normalizedEmail)
      );
    }

    return { inviteToken, addedToTrip: true };
  }

  if (!invitedBy) {
    throw new Error('You must be signed in to send invites.');
  }

  const { error: inviteError } = await client.from('trip_invites').upsert(
    {
      trip_id: tripId,
      email: normalizedEmail,
      role,
      invite_token: inviteToken,
      invited_by: invitedBy,
    },
    { onConflict: 'trip_id,email' }
  );

  if (inviteError) {
    const msg = getErrorMessage(inviteError);
    if (
      msg.includes('trip_invites') ||
      msg.includes('does not exist') ||
      inviteError.code === '42P01'
    ) {
      throw new Error(
        'Run supabase/trip_invites.sql in your Supabase SQL editor, then try again.'
      );
    }
    if (msg.includes('row-level security') || inviteError.code === '42501') {
      throw new Error(
        'Permission denied creating invite. Re-run supabase/trip_invites.sql (updated policies), then try again.'
      );
    }
    throw new Error(msg);
  }

  return { inviteToken, addedToTrip: false };
}

export async function lookupTripInvite(
  token: string
): Promise<{ tripId: string; role: 'editor' | 'viewer' } | null> {
  const client = requireSupabaseClient();
  const normalized = token.trim().toUpperCase();

  const { data, error } = await client.rpc('lookup_trip_invite', {
    invite_code: normalized,
  });
  if (error) {
    if (__DEV__) console.warn('[Wandr] lookup_trip_invite:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.trip_id) return null;
  return {
    tripId: row.trip_id as string,
    role: (row.role as 'editor' | 'viewer') ?? 'viewer',
  };
}

/** Add the signed-in user to a trip using a pending invite code (server-side, bypasses member RLS). */
export async function joinTripByToken(_userId: string, token: string): Promise<string> {
  const client = requireSupabaseClient();
  const normalized = token.trim().toUpperCase();

  const { data, error } = await client.rpc('join_trip_by_invite', {
    invite_code: normalized,
  });

  if (error) {
    const msg = error.message ?? '';
    if (
      msg.includes('join_trip_by_invite') ||
      error.code === 'PGRST202' ||
      error.code === '42883'
    ) {
      throw new Error(
        'Run supabase/join_trip_by_invite.sql in your Supabase SQL editor, then try again.'
      );
    }
    if (msg.includes('Invalid or expired invite')) {
      throw new Error('Invalid or expired invite code.');
    }
    throw new Error(getErrorMessage(error, 'Could not join trip.'));
  }

  const tripId = typeof data === 'string' ? data : (data as string | null);
  if (!tripId) {
    throw new Error('Invalid or expired invite code.');
  }
  return tripId;
}

function clearLocalPendingInvite(
  tripId: string,
  userId: string,
  email?: string
): void {
  const normalized = email?.trim().toLowerCase();
  saveLocalPendingInvites(
    tripId,
    getLocalPendingInvites(tripId).filter(
      (p) =>
        p.userId !== userId &&
        (!normalized || p.email?.toLowerCase() !== normalized)
    )
  );
}

export async function removeMember(
  tripId: string,
  userId: string,
  email?: string
): Promise<void> {
  if (userId.startsWith('pending-')) {
    const inviteId = userId.slice('pending-'.length);
    clearLocalPendingInvite(tripId, userId, email);

    const client = requireSupabaseClient();

    const isInviteUuid = /^[0-9a-f-]{36}$/i.test(inviteId);
    let query = client.from('trip_invites').delete().eq('trip_id', tripId);

    if (isInviteUuid) {
      query = query.eq('id', inviteId);
    } else if (email) {
      query = query.eq('email', email.trim().toLowerCase());
    } else {
      throw new Error('Could not identify invite to remove.');
    }

    const { error } = await query;
    if (error) {
      throw new Error(getErrorMessage(error, 'Could not remove invite.'));
    }
    return;
  }

  const client = requireSupabaseClient();
  const { error } = await client
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId);
  if (error) throw error;
}

export { fetchTripMembersWithOwner as fetchTripMembers };
