import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { createSessionFromUrl } from '@/lib/authSessionFromUrl';
import { persistSupabaseSession } from '@/services/auth/sessionPersistence';
import { queryClient } from '@/lib/queryClient';
import { tripKeys } from '@/features/trips/hooks/useTrips';
import { upsertUserProfile } from '@/services/auth/userService';
import { useAuthStore } from '@/stores/authStore';
import { colors, typography } from '@/theme';

export default function AuthCallbackScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  const [message, setMessage] = useState('Confirming your email…');

  useEffect(() => {
    const finish = async (url: string) => {
      try {
        const { session, user } = await createSessionFromUrl(url);
        if (!session || !user) throw new Error('Could not start session');

        await persistSupabaseSession(session);
        const profile = {
          id: user.id,
          email: user.email ?? '',
          fullName: (user.user_metadata?.full_name as string) ?? 'Traveler',
          avatarUrl: user.user_metadata?.avatar_url as string | undefined,
          createdAt: user.created_at,
        };
        await upsertUserProfile(profile);
        setUser(profile);
        setSessionReady(true);
        setOnboardingComplete(true);
        await queryClient.invalidateQueries({ queryKey: tripKeys.all });
        router.replace('/(tabs)');
      } catch (e) {
        setMessage(
          e instanceof Error
            ? e.message
            : 'Confirmation failed. Try signing in — your email may already be verified.'
        );
        setTimeout(() => router.replace('/(auth)/login'), 4000);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) void finish(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      void finish(url);
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      void finish(window.location.href);
    }

    return () => sub.remove();
  }, [setUser, setOnboardingComplete, setSessionReady]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.gold} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    ...typography.body,
    marginTop: 16,
    textAlign: 'center',
  },
});
