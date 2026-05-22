import {
  countUnreadChatMessages,
  readAtFromMessages,
} from '@/features/chat/lib/chatReadState';
import type { TripMessage } from '@/types';

const base = (overrides: Partial<TripMessage>): TripMessage => ({
  id: '1',
  tripId: 't1',
  userId: 'u1',
  body: 'hi',
  createdAt: '2026-01-01T10:00:00Z',
  authorName: 'A',
  ...overrides,
});

describe('countUnreadChatMessages', () => {
  it('counts messages from others after last read', () => {
    const messages = [
      base({ id: '1', userId: 'other', createdAt: '2026-01-01T11:00:00Z' }),
      base({ id: '2', userId: 'me', createdAt: '2026-01-01T12:00:00Z' }),
      base({ id: '3', userId: 'other', createdAt: '2026-01-01T09:00:00Z' }),
    ];
    expect(
      countUnreadChatMessages(messages, 'me', '2026-01-01T10:00:00Z')
    ).toBe(1);
  });

  it('counts all from others when never read', () => {
    const messages = [
      base({ userId: 'other' }),
      base({ userId: 'me' }),
    ];
    expect(countUnreadChatMessages(messages, 'me', null)).toBe(1);
  });
});

describe('readAtFromMessages', () => {
  it('returns latest createdAt', () => {
    const messages = [
      base({ createdAt: '2026-01-01T09:00:00Z' }),
      base({ createdAt: '2026-01-01T12:00:00Z' }),
    ];
    expect(readAtFromMessages(messages)).toBe('2026-01-01T12:00:00Z');
  });
});
