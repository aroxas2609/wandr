import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import { generateId, isUuid } from '@/lib/ids';
import { getSupabaseClient } from '@/services/supabase/client';
import { enqueue } from '@/services/sync/syncQueue';
import { getSmartRecommendations } from '@/utils/packing';
import type { PackingItem } from '@/types';

function seedPacking(): PackingItem[] {
  return getJson<PackingItem[]>(StorageKeys.packing) ?? [];
}

function savePacking(items: PackingItem[]): void {
  setJson(StorageKeys.packing, items);
}

function mapDbPacking(row: Record<string, unknown>): PackingItem {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    name: row.name as string,
    category: row.category as string,
    packed: Boolean(row.packed),
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
  };
}

function mapPackingToDb(item: PackingItem) {
  return {
    id: item.id,
    trip_id: item.tripId,
    name: item.name,
    category: item.category,
    packed: item.packed,
    sort_order: item.sortOrder,
  };
}

function mergePackingCache(fetched: PackingItem[]): void {
  const existing = seedPacking();
  const ids = new Set(fetched.map((i) => i.id));
  const merged = [...existing.filter((i) => !ids.has(i.id)), ...fetched];
  savePacking(merged);
}

function getTripPacking(tripId: string): PackingItem[] {
  return seedPacking()
    .filter((i) => i.tripId === tripId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function fetchPackingItems(tripId: string): Promise<PackingItem[]> {
  const client = getSupabaseClient();
  if (!client) {
    return getTripPacking(tripId);
  }

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    return getTripPacking(tripId);
  }

  const { data, error } = await client
    .from('packing_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('sort_order');
  if (error) throw error;

  const remote = (data ?? []).map(mapDbPacking);
  mergePackingCache(remote);
  return getTripPacking(tripId);
}

export async function createPackingItem(
  tripId: string,
  name: string,
  category: string
): Promise<PackingItem> {
  const existing = getTripPacking(tripId);
  const item: PackingItem = {
    id: generateId(),
    tripId,
    name,
    category,
    packed: false,
    sortOrder: existing.length,
    createdAt: new Date().toISOString(),
  };

  savePacking([...seedPacking(), item]);

  const client = getSupabaseClient();
  if (client) {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      savePacking(seedPacking().filter((i) => i.id !== item.id));
      throw new Error('Sign in to add packing items.');
    }
    const { error } = await client.from('packing_items').insert(mapPackingToDb(item));
    if (error) {
      savePacking(seedPacking().filter((i) => i.id !== item.id));
      throw error;
    }
  } else {
    enqueue('insert', 'packing_items', item as unknown as Record<string, unknown>);
  }

  return item;
}

export async function togglePackingItem(id: string, packed: boolean): Promise<PackingItem> {
  const items = seedPacking();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) throw new Error('Item not found');

  const updated = { ...items[index], packed };
  items[index] = updated;
  savePacking(items);

  const client = getSupabaseClient();
  if (client && isUuid(id)) {
    const { error } = await client
      .from('packing_items')
      .update({ packed })
      .eq('id', id);
    if (error) throw error;
  } else if (!client) {
    enqueue('update', 'packing_items', updated as unknown as Record<string, unknown>);
  }

  return updated;
}

export async function deletePackingItem(id: string): Promise<void> {
  savePacking(seedPacking().filter((i) => i.id !== id));

  if (!isUuid(id)) {
    return;
  }

  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('packing_items').delete().eq('id', id);
    if (error) throw error;
  } else {
    enqueue('delete', 'packing_items', { id });
  }
}

export async function suggestPackingItems(
  tripId: string,
  destination: string
): Promise<PackingItem[]> {
  const suggestions = getSmartRecommendations(destination);
  const created: PackingItem[] = [];
  for (const name of suggestions) {
    const existing = seedPacking().find(
      (i) => i.tripId === tripId && i.name.toLowerCase() === name.toLowerCase()
    );
    if (!existing) {
      created.push(await createPackingItem(tripId, name, 'Essentials'));
    }
  }
  return created;
}
