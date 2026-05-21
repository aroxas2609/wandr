import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { invalidateTripQueries } from '@/lib/realtimeInvalidation';
import { isSupabaseConfigured, getSupabaseClient } from '@/services/supabase/client';
import { useAuthStore } from '@/stores/authStore';

const DEBOUNCE_MS = 300;

type PostgresChangePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

function subscribeTripChannel(
  tripId: string,
  dayIds: string[],
  onChange: (table: string) => void
): RealtimeChannel | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client.channel(`trip:${tripId}`);

  const handler =
    (table: string) =>
    (_payload: PostgresChangePayload) => {
      if (__DEV__) {
        console.warn(`[Wandr] realtime: ${table} changed for trip ${tripId}`);
      }
      onChange(table);
    };

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
    handler('trips')
  );

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'itinerary_days',
      filter: `trip_id=eq.${tripId}`,
    },
    handler('itinerary_days')
  );

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'trip_members',
      filter: `trip_id=eq.${tripId}`,
    },
    handler('trip_members')
  );

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'expenses',
      filter: `trip_id=eq.${tripId}`,
    },
    handler('expenses')
  );

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'packing_items',
      filter: `trip_id=eq.${tripId}`,
    },
    handler('packing_items')
  );

  for (const dayId of dayIds) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'activities',
        filter: `day_id=eq.${dayId}`,
      },
      handler('activities')
    );
  }

  channel.subscribe((status) => {
    if (__DEV__ && status === 'SUBSCRIBED') {
      console.warn(`[Wandr] realtime subscribed: trip:${tripId}`);
    }
  });

  return channel;
}

/**
 * Subscribe to Supabase Realtime for a trip while the screen is mounted.
 * Refetches React Query data when collaborators change itinerary, budget, etc.
 */
export function useTripRealtime(tripId: string, dayIds: string[]): void {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dayIdsRef = useRef(dayIds);
  dayIdsRef.current = dayIds;
  const dayIdsKey = dayIds.join(',');

  useEffect(() => {
    if (!tripId || !isAuthenticated || !sessionReady || !isSupabaseConfigured()) {
      return;
    }

    const scheduleInvalidate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        invalidateTripQueries(queryClient, tripId, dayIdsRef.current);
      }, DEBOUNCE_MS);
    };

    const channel = subscribeTripChannel(tripId, dayIdsRef.current, () => scheduleInvalidate());
    const client = getSupabaseClient();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (channel && client) {
        void client.removeChannel(channel);
      }
    };
  }, [tripId, dayIdsKey, isAuthenticated, sessionReady, queryClient]);
}
