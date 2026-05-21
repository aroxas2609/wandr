import { QueryClientProvider } from '@tanstack/react-query';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WebSafeAreaProvider } from '@/providers/WebSafeAreaProvider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WebNavigationBridge } from '@/components/WebNavigationBridge';
import { AppMessageHost } from '@/components/AppMessageHost';
import { restoreSupabaseSession, hasSupabaseSession } from '@/services/auth/sessionPersistence';
import { tripKeys } from '@/features/trips/hooks/useTrips';
import { getJson, StorageKeys } from '@/lib/mmkv';
import { clearUserTripCache } from '@/lib/userDataCache';
import {
  getPendingInviteToken,
  clearPendingInviteToken,
} from '@/lib/pendingInvite';
import { joinTripByToken } from '@/features/collaboration/services/memberService';
import { router } from 'expo-router';
import type { User } from '@/types';
import { useEffect } from 'react';

interface AppProvidersProps {
  children: React.ReactNode;
}

function NetworkSyncBridge() {
  useNetworkStatus();
  return null;
}

export function AppProviders({ children }: AppProvidersProps) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  const signOut = useAuthStore((s) => s.signOut);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!sessionReady || !isAuthenticated || !userId) return;
    const pending = getPendingInviteToken();
    if (!pending) return;

    void (async () => {
      try {
        const tripId = await joinTripByToken(userId, pending);
        clearPendingInviteToken();
        router.replace(`/trip/${tripId}`);
      } catch {
        router.replace(`/trip/join?token=${encodeURIComponent(pending)}`);
      }
    })();
  }, [sessionReady, isAuthenticated, userId]);

  useEffect(() => {
    void (async () => {
      await restoreSupabaseSession();

      const sessionOk = await hasSupabaseSession();
      setSessionReady(sessionOk);
      hydrate();

      const cachedUser = getJson<User>(StorageKeys.auth);
      if (cachedUser && !sessionOk) {
        clearUserTripCache();
        signOut();
        return;
      }

      if (sessionOk && cachedUser) {
        await queryClient.invalidateQueries({ queryKey: tripKeys.all });
      }
    })();
  }, [hydrate, setSessionReady, signOut]);

  return (
    <WebSafeAreaProvider>
      <GestureHandlerRootView
        style={Platform.OS === 'web' ? styles.webRoot : styles.nativeRoot}
      >
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <NetworkSyncBridge />
            <WebNavigationBridge />
            <AppMessageHost />
            {children}
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </WebSafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  nativeRoot: { flex: 1 },
  webRoot: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
});
