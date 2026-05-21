import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { joinTripByToken } from '@/features/collaboration/services/memberService';
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const userId = useAuthStore((s) => s.user?.id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token.trim()) {
      setError('Missing invite code.');
      return;
    }

    if (!sessionReady) return;

    if (!isAuthenticated || !userId) {
      setPendingInviteToken(token);
      router.replace('/(auth)/login');
      return;
    }

    let cancelled = false;
    void (async () => {
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, isAuthenticated, sessionReady, userId]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.title}>Could not join trip</Text>
          <Text style={styles.body}>{error}</Text>
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
});
