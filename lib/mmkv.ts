import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'wandr-storage' });

export function getJson<T>(key: string): T | null {
  const value = storage.getString(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function setJson<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  storage.remove(key);
}

export const StorageKeys = {
  trips: 'trips',
  days: 'itinerary_days',
  activities: 'activities',
  members: 'trip_members',
  tripInvites: 'trip_invites_pending',
  expenses: 'expenses',
  packing: 'packing_items',
  documents: 'travel_documents',
  notifications: 'notifications',
  userProfile: 'user_profile',
  auth: 'auth_session',
  onboarding: 'onboarding_complete',
  syncQueue: 'sync_queue',
  seeded: 'data_seeded',
  pwaInstallBannerDismissed: 'pwa_install_banner_dismissed',
} as const;
