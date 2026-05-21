import '../global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AppProviders } from '@/providers/AppProviders';
import { MobileOnlyGate } from '@/components/MobileOnlyGate';
import { colors } from '@/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    CormorantGaramond_600SemiBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProviders>
      <MobileOnlyGate>
        <StatusBar style="light" />
        <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
            flex: Platform.OS === 'web' ? 1 : undefined,
          },
          animation: Platform.OS === 'web' ? 'slide_from_right' : 'fade',
          gestureEnabled: Platform.OS !== 'web',
          fullScreenGestureEnabled: Platform.OS === 'ios',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trip/join" />
        <Stack.Screen name="trip/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/activity/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        </Stack>
      </MobileOnlyGate>
    </AppProviders>
  );
}
