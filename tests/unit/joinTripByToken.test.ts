import { joinTripByToken } from '@/features/collaboration/services/memberService';

const mockRpc = jest.fn();

jest.mock('@/services/supabase/client', () => ({
  requireSupabaseClient: () => ({ rpc: mockRpc }),
}));

describe('joinTripByToken', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('returns trip id from join_trip_by_invite rpc', async () => {
    mockRpc.mockResolvedValue({ data: 'trip-uuid-1', error: null });
    await expect(joinTripByToken('user-1', 'abc123')).resolves.toBe('trip-uuid-1');
    expect(mockRpc).toHaveBeenCalledWith('join_trip_by_invite', { invite_code: 'ABC123' });
  });

  it('throws when rpc reports invalid invite', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Invalid or expired invite code', code: '22023' },
    });
    await expect(joinTripByToken('user-1', 'bad')).rejects.toThrow('Invalid or expired invite code');
  });
});
