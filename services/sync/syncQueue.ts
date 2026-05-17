import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import { getSupabaseClient } from '@/services/supabase/client';
import { applySyncItem } from './syncHandlers';

export type SyncOperation = 'insert' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  op: SyncOperation;
  table: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

function getQueue(): SyncQueueItem[] {
  return getJson<SyncQueueItem[]>(StorageKeys.syncQueue) ?? [];
}

function saveQueue(queue: SyncQueueItem[]): void {
  setJson(StorageKeys.syncQueue, queue);
}

export function enqueue(
  op: SyncOperation,
  table: string,
  payload: Record<string, unknown>
): SyncQueueItem {
  const item: SyncQueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    op,
    table,
    payload,
    createdAt: new Date().toISOString(),
  };
  const queue = getQueue();
  queue.push(item);
  saveQueue(queue);
  return item;
}

export function getPendingItems(): SyncQueueItem[] {
  return getQueue();
}

export function clearQueue(): void {
  saveQueue([]);
}

export function removeItem(id: string): void {
  const queue = getQueue().filter((item) => item.id !== id);
  saveQueue(queue);
}

export async function flush(): Promise<{ processed: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  const client = getSupabaseClient();
  if (!client) {
    return { processed: 0, failed: queue.length };
  }

  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await applySyncItem(item);
      removeItem(item.id);
      processed++;
    } catch (err) {
      if (__DEV__) {
        console.warn('[Wandr Sync] Flush failed for item:', item.table, err);
      }
      failed++;
    }
  }

  return { processed, failed };
}

export function getQueueLength(): number {
  return getQueue().length;
}
