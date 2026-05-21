import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { invalidateTripQueries } from '@/lib/realtimeInvalidation';

const mockRemoveChannel = jest.fn();
const mockSubscribe = jest.fn();
const handlers: Array<() => void> = [];

type MockChannel = {
  on: jest.Mock;
  subscribe: jest.Mock;
};

const mockChannel: MockChannel = {
  on: jest.fn((_type: string, _config: unknown, callback: () => void) => {
    handlers.push(callback);
    return mockChannel;
  }),
  subscribe: mockSubscribe.mockImplementation((cb?: (status: string) => void) => {
    cb?.('SUBSCRIBED');
    return mockChannel;
  }),
};

jest.mock('@/services/supabase/client', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  getSupabaseClient: jest.fn(() => ({
    channel: jest.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  })),
}));

jest.mock('@/lib/realtimeInvalidation', () => ({
  invalidateTripQueries: jest.fn(),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn((selector: (s: { isAuthenticated: boolean; sessionReady: boolean }) => unknown) =>
    selector({ isAuthenticated: true, sessionReady: true })
  ),
}));

import { useTripRealtime } from '@/hooks/useTripRealtime';

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe('useTripRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    handlers.length = 0;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('subscribes to a trip channel and debounces invalidation', () => {
    const { unmount } = renderHook(
      () => useTripRealtime('trip-99', ['day-1']),
      { wrapper: createWrapper() }
    );

    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockSubscribe).toHaveBeenCalled();

    act(() => {
      handlers[0]?.();
    });

    expect(invalidateTripQueries).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(invalidateTripQueries).toHaveBeenCalledWith(
      expect.any(QueryClient),
      'trip-99',
      ['day-1']
    );

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
