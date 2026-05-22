import { shouldSendPush } from '@/features/notifications/services/createNotification';

describe('shouldSendPush', () => {
  it('returns false when push disabled', () => {
    expect(
      shouldSendPush(
        { push_notifications: false, trip_updates: true, expo_push_token: 'tok' },
        'chat_message'
      )
    ).toBe(false);
  });

  it('returns false when trip updates disabled for trip events', () => {
    expect(
      shouldSendPush(
        { push_notifications: true, trip_updates: false, expo_push_token: 'tok' },
        'chat_message'
      )
    ).toBe(false);
  });

  it('returns true when prefs allow push', () => {
    expect(
      shouldSendPush(
        { push_notifications: true, trip_updates: true, expo_push_token: 'tok' },
        'member_joined'
      )
    ).toBe(true);
  });
});
