import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { isMobileWebViewport } from '@/lib/mobileWeb';

/** True on native apps; on web, true when viewport looks like a phone/tablet. */
export function useIsMobileWeb(): boolean {
  const { width } = useWindowDimensions();

  return useMemo(
    () => isMobileWebViewport(Platform.OS, width),
    [width]
  );
}
