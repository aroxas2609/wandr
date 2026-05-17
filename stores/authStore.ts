import { create } from 'zustand';
import { getJson, setJson, StorageKeys } from '@/lib/mmkv';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  isHydrated: boolean;
  /** Supabase JWT is on the client — required before live trip reads */
  sessionReady: boolean;
  setUser: (user: User | null) => void;
  setOnboardingComplete: (value: boolean) => void;
  setSessionReady: (value: boolean) => void;
  hydrate: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  onboardingComplete: false,
  isHydrated: false,
  sessionReady: false,
  setUser: (user) => {
    setJson(StorageKeys.auth, user);
    set({ user, isAuthenticated: !!user });
  },
  setOnboardingComplete: (value) => {
    setJson(StorageKeys.onboarding, value);
    set({ onboardingComplete: value });
  },
  setSessionReady: (value) => set({ sessionReady: value }),
  hydrate: () => {
    const user = getJson<User>(StorageKeys.auth);
    const onboardingComplete = getJson<boolean>(StorageKeys.onboarding) ?? false;
    set({
      user,
      isAuthenticated: !!user,
      onboardingComplete,
      isHydrated: true,
    });
  },
  signOut: () => {
    setJson(StorageKeys.auth, null);
    set({ user: null, isAuthenticated: false, sessionReady: false });
  },
}));
