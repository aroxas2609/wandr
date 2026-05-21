import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { joinTripByToken } from '@/features/collaboration/services/memberService';
import { hasSupabaseSession } from '@/services/auth/sessionPersistence';
import {
  setPendingInviteToken,
  clearPendingInviteToken,
  getPendingInviteToken,
} from '@/lib/pendingInvite';
import { resolveSearchParam } from '@/lib/routeParams';
import { getErrorMessage } from '@/lib/errors';
import { showAppMessage } from '@/stores/appMessageStore';
import { colors, typography, spacing } from '@/theme';

export default function TripJoinScreen() {
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const token = resolveSearchParam(tokenParam) ?? getPendingInviteToken() ?? '';
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  const userId = useAuthStore((s) => s.user?.id);
  const [error, setError] = useState('');
  const joinStarted = useRef(false);

  useEffect(() => {
    if (!token.trim()) {
      setError('Missing invite code. Ask the trip owner to share the link again.');
      return;
    }

    if (!isHydrated) return;

    if (!isAuthenticated || !userId) {
      setPendingInviteToken(token);
      router.replace('/(auth)/login');
      return;
    }

    let cancelled = false;

    void (async () => {
      let ready = sessionReady;
      if (!ready) {
        ready = await hasSupabaseSession();
        if (ready) setSessionReady(true);
      }
      if (!ready) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        if (cancelled) return;
        ready = await hasSupabaseSession();
        if (ready) setSessionReady(true);
      }
      if (!ready) {
        if (!cancelled) {
          setError('Sign in to join this trip, then open the invite link again.');
        }
        return;
      }

      if (joinStarted.current) return;
      joinStarted.current = true;
      setError('');

      try {
        const tripId = await joinTripByToken(userId, token);
        if (cancelled) return;
        clearPendingInviteToken();
        router.replace(`/trip/${tripId}`);
      } catch (e) {
        if (cancelled) return;
        const message = getErrorMessage(e, 'Could not join trip.');
        setError(message);
        showAppMessage('Join trip', message);
      } finally {
        joinStarted.current = false;
      }
    })();

    return () => {
      cancelled = true;
      joinStarted.current = false;
    };
  }, [token, isHydrated, isAuthenticated, sessionReady, userId, setSessionReady]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.title}>Could not join trip</Text>
          <Text style={styles.body}>{error}</Text>
          <Pressable
            onPress={() => router.replace('/(tabs)/trips')}
            style={styles.button}
            accessibilityRole="button"
          >
            <Text style={styles.buttonLabel}>Go to My Trips</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.body}>Joining trip…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { ...typography.h3 },
  body: { ...typography.body, textAlign: 'center' },
  button: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  buttonLabel: { ...typography.label, color: colors.gold },
});
