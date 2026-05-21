import { getJson, setJson, removeKey, StorageKeys } from '@/lib/mmkv';

export function setPendingInviteToken(token: string): void {
  setJson(StorageKeys.pendingInviteToken, token.trim().toUpperCase());
}

export function getPendingInviteToken(): string | null {
  return getJson<string>(StorageKeys.pendingInviteToken);
}

export function clearPendingInviteToken(): void {
  removeKey(StorageKeys.pendingInviteToken);
}
