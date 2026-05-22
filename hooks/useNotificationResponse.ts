import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import type { NotificationData } from '@/types';

function navigateFromNotification(data: NotificationData | undefined) {
  if (!data?.tripId) return;
  const path = data.path ?? '';
  if (path.includes('chat')) {
    router.push(`/trip/${data.tripId}/chat`);
    return;
  }
  router.push(`/trip/${data.tripId}`);
}

export function useNotificationResponse() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const raw = response.notification.request.content.data as NotificationData | undefined;
      navigateFromNotification(raw);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const raw = response.notification.request.content.data as NotificationData | undefined;
      navigateFromNotification(raw);
    });

    return () => sub.remove();
  }, []);
}
