import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { flush } from '@/services/sync/syncQueue';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const wasOnline = useRef(true);

  useEffect(() => {
    const onReconnect = async () => {
      setIsOnline(true);
      if (!wasOnline.current) {
        await flush();
      }
      wasOnline.current = true;
    };

    const onDisconnect = () => {
      setIsOnline(false);
      wasOnline.current = false;
    };

    if (Platform.OS === 'web') {
      if (typeof globalThis !== 'undefined' && 'addEventListener' in globalThis) {
        globalThis.addEventListener?.('online', onReconnect);
        globalThis.addEventListener?.('offline', onDisconnect);
        wasOnline.current = globalThis.navigator?.onLine !== false;
        setIsOnline(wasOnline.current);
      }
      return () => {
        globalThis.removeEventListener?.('online', onReconnect);
        globalThis.removeEventListener?.('offline', onDisconnect);
      };
    }

    let unsubscribe: (() => void) | undefined;

    void import('@react-native-community/netinfo').then((NetInfo) => {
      unsubscribe = NetInfo.default.addEventListener((state) => {
        const online =
          state.isConnected === true &&
          (state.isInternetReachable === true || state.isInternetReachable === null);
        if (online) {
          void onReconnect();
        } else {
          onDisconnect();
        }
      });
    });

    return () => unsubscribe?.();
  }, []);

  return { isOnline };
}
