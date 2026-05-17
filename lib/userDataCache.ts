import { removeKey, StorageKeys } from '@/lib/mmkv';

/** Clears locally cached trip data (e.g. on sign-out or stale session). */
export function clearUserTripCache(): void {
  removeKey(StorageKeys.trips);
  removeKey(StorageKeys.days);
  removeKey(StorageKeys.activities);
  removeKey(StorageKeys.members);
  removeKey(StorageKeys.tripInvites);
  removeKey(StorageKeys.expenses);
  removeKey(StorageKeys.packing);
  removeKey(StorageKeys.documents);
  removeKey(StorageKeys.seeded);
  removeKey(StorageKeys.notifications);
}
