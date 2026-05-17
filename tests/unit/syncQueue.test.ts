import {
  enqueue,
  getPendingItems,
  clearQueue,
  removeItem,
  flush,
  getQueueLength,
} from '@/services/sync/syncQueue';

jest.mock('@/services/supabase/client', () => ({
  getSupabaseClient: jest.fn(() => ({})),
}));

jest.mock('@/services/sync/syncHandlers', () => ({
  applySyncItem: jest.fn().mockResolvedValue(undefined),
}));

describe('sync queue', () => {
  beforeEach(() => {
    clearQueue();
  });

  it('enqueues items', () => {
    enqueue('insert', 'trips', { id: '1' });
    expect(getQueueLength()).toBe(1);
  });

  it('returns pending items', () => {
    enqueue('update', 'activities', { id: 'a1' });
    const items = getPendingItems();
    expect(items).toHaveLength(1);
    expect(items[0].op).toBe('update');
    expect(items[0].table).toBe('activities');
  });

  it('removes item by id', () => {
    const item = enqueue('delete', 'trips', { id: '1' });
    removeItem(item.id);
    expect(getQueueLength()).toBe(0);
  });

  it('flushes queue when Supabase is configured', async () => {
    enqueue('insert', 'trips', { id: '1' });
    enqueue('insert', 'trips', { id: '2' });
    const result = await flush();
    expect(result.processed).toBe(2);
    expect(getQueueLength()).toBe(0);
  });
});
