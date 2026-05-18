import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import {
  SafeAreaProvider,
  type Metrics,
} from 'react-native-safe-area-context';
import { readWebSafeAreaInsets } from '@/lib/webSafeArea';
import { isPwaStandalone } from '@/lib/pwaInstall';

function buildWebMetrics(): Metrics {
  const { width, height } = Dimensions.get('window');
  const insets = readWebSafeAreaInsets();
  return {
    frame: { x: 0, y: 0, width, height },
    insets,
  };
}

interface WebSafeAreaProviderProps {
  children: React.ReactNode;
}

/**
 * On mobile web / PWA, react-native-safe-area-context often reports zero insets.
 * Probe CSS env(safe-area-inset-*) so layout fills the screen edge-to-edge.
 */
export function WebSafeAreaProvider({ children }: WebSafeAreaProviderProps) {
  const [webMetrics, setWebMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const sync = () => setWebMetrics(buildWebMetrics());
    sync();

    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, []);

  if (Platform.OS !== 'web') {
    return <SafeAreaProvider>{children}</SafeAreaProvider>;
  }

  const metrics = webMetrics ?? buildWebMetrics();
  const useWebInsets = isPwaStandalone() || metrics.insets.bottom > 0 || metrics.insets.top > 0;

  return (
    <SafeAreaProvider initialMetrics={useWebInsets ? metrics : undefined}>
      {children}
    </SafeAreaProvider>
  );
}
