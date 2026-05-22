import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { getSupabaseClient } from '@/services/supabase/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!Device.isDevice) return;

  const client = getSupabaseClient();
  if (!client) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    process.env.EAS_PROJECT_ID;
  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const token = tokenData.data;
  if (!token) return;

  const { error } = await client
    .from('users')
    .update({ expo_push_token: token })
    .eq('id', userId);
  if (error && __DEV__) {
    console.warn('[Wandr] registerPushToken:', error.message);
  }
}
