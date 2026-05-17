import { useEffect, useMemo, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { getWebGateStatus, type WebGateStatus } from '@/lib/mobileWeb';

function readWebNavigator(): { userAgent: string; maxTouchPoints: number } {
  if (typeof navigator === 'undefined') {
    return { userAgent: '', maxTouchPoints: 0 };
  }
  return {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  };
}

export function useWebGateStatus(): WebGateStatus {
  const { width, height } = useWindowDimensions();
  const [nav, setNav] = useState(readWebNavigator);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const sync = () => setNav(readWebNavigator());
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, []);

  return useMemo(
    () => getWebGateStatus(Platform.OS, width, height, nav.userAgent, nav.maxTouchPoints),
    [width, height, nav.userAgent, nav.maxTouchPoints]
  );
}

/** True on native apps; on web, true when the gate allows the app (phone or tablet portrait). */
export function useIsMobileWeb(): boolean {
  return useWebGateStatus() === 'allowed';
}
