import * as SecureStore from 'expo-secure-store';
import { storage } from './mmkv';

const SESSION_KEY = 'wandr_session';
const FALLBACK_SESSION_KEY = 'wandr_secure_session';

async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function saveSession(token: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(SESSION_KEY, token);
    storage.remove(FALLBACK_SESSION_KEY);
    return;
  }
  storage.set(FALLBACK_SESSION_KEY, token);
}

export async function getSession(): Promise<string | null> {
  if (await isSecureStoreAvailable()) {
    return SecureStore.getItemAsync(SESSION_KEY);
  }
  return storage.getString(FALLBACK_SESSION_KEY) ?? null;
}

export async function clearSession(): Promise<void> {
  if (await isSecureStoreAvailable()) {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch {
      // Key may not exist
    }
  }
  storage.remove(FALLBACK_SESSION_KEY);
}
