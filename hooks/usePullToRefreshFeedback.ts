import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function formatRefreshTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Spinner state, haptic, and "Last updated" label for pull-to-refresh screens. */
export function usePullToRefreshFeedback(isRefetching = false) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [refreshHint, setRefreshHint] = useState<string | null>(null);

  useEffect(() => {
    if (!refreshHint) return;
    const timer = setTimeout(() => setRefreshHint(null), 2500);
    return () => clearTimeout(timer);
  }, [refreshHint]);

  const markSuccess = useCallback(() => {
    setLastRefreshedAt(new Date());
    setRefreshHint('Up to date');
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const isBusy = refreshing || isRefetching;
  const statusText = isBusy
    ? 'Refreshing…'
    : refreshHint ?? (lastRefreshedAt ? `Last updated ${formatRefreshTime(lastRefreshedAt)}` : null);

  return {
    refreshing,
    setRefreshing,
    setRefreshHint,
    markSuccess,
    statusText,
    isBusy,
  };
}
