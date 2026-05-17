import { useState } from 'react';
import { Platform } from 'react-native';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';
import { DesktopWebBlock } from './DesktopWebBlock';

interface MobileOnlyGateProps {
  children: React.ReactNode;
}

/**
 * On web, blocks desktop-sized viewports and shows install-on-mobile guidance.
 * Native iOS/Android builds are unaffected.
 */
export function MobileOnlyGate({ children }: MobileOnlyGateProps) {
  const isMobile = useIsMobileWeb();
  const [devBypass, setDevBypass] = useState(false);

  if (Platform.OS === 'web' && !isMobile && !devBypass) {
    return <DesktopWebBlock onDevBypass={() => setDevBypass(true)} />;
  }

  return <>{children}</>;
}
