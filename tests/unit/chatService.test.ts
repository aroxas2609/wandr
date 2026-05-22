jest.mock('@/services/supabase/client', () => ({
  getSupabaseClient: jest.fn(() => null),
}));

import { fetchTripMessages } from '@/features/chat/services/chatService';

describe('fetchTripMessages', () => {
  it('returns empty list when supabase is not configured', async () => {
    await expect(fetchTripMessages('trip-1')).resolves.toEqual([]);
  });
});
