import { getSupabaseClient } from '@/services/supabase/client';
import { payloadToDb } from '@/lib/supabaseMappers';
import type { SyncQueueItem } from './syncQueue';

export async function applySyncItem(item: SyncQueueItem): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { op, table, payload } = item;
  const id = payload.id as string;
  const row = payloadToDb(table, payload);

  switch (table) {
    case 'trips': {
      if (op === 'insert') {
        const { error } = await client.from('trips').upsert(row);
        if (error) throw error;
      } else if (op === 'update') {
        const { error } = await client.from('trips').update(row).eq('id', id);
        if (error) throw error;
      } else if (op === 'delete') {
        const { error } = await client.from('trips').delete().eq('id', id);
        if (error) throw error;
      }
      break;
    }
    case 'itinerary_days': {
      if (op === 'insert') {
        const { error } = await client.from('itinerary_days').upsert(row);
        if (error) throw error;
      } else if (op === 'update') {
        const { error } = await client.from('itinerary_days').update(row).eq('id', id);
        if (error) throw error;
      } else if (op === 'delete') {
        const { error } = await client.from('itinerary_days').delete().eq('id', id);
        if (error) throw error;
      }
      break;
    }
    case 'activities': {
      if (op === 'insert') {
        const { error } = await client.from('activities').upsert(row);
        if (error) throw error;
      } else if (op === 'update') {
        const { error } = await client.from('activities').update(row).eq('id', id);
        if (error) throw error;
      } else if (op === 'delete') {
        const { error } = await client.from('activities').delete().eq('id', id);
        if (error) throw error;
      }
      break;
    }
    case 'expenses': {
      if (op === 'insert') {
        const { error } = await client.from('expenses').upsert(row);
        if (error) throw error;
      } else if (op === 'update') {
        const { error } = await client.from('expenses').update(row).eq('id', id);
        if (error) throw error;
      } else if (op === 'delete') {
        const { error } = await client.from('expenses').delete().eq('id', id);
        if (error) throw error;
      }
      break;
    }
    case 'packing_items': {
      if (op === 'insert') {
        const { error } = await client.from('packing_items').upsert(row);
        if (error) throw error;
      } else if (op === 'update') {
        const { error } = await client.from('packing_items').update(row).eq('id', id);
        if (error) throw error;
      } else if (op === 'delete') {
        const { error } = await client.from('packing_items').delete().eq('id', id);
        if (error) throw error;
      }
      break;
    }
    case 'travel_documents': {
      if (op === 'insert') {
        const { error } = await client.from('travel_documents').upsert(row);
        if (error) throw error;
      } else if (op === 'update') {
        const { error } = await client.from('travel_documents').update(row).eq('id', id);
        if (error) throw error;
      } else if (op === 'delete') {
        const { error } = await client.from('travel_documents').delete().eq('id', id);
        if (error) throw error;
      }
      break;
    }
    default:
      if (__DEV__) {
        console.warn(`[Wandr Sync] Unknown table: ${table}`);
      }
  }
}
