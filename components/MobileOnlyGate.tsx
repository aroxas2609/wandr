import { useState } from 'react';
import { Platform } from 'react-native';
import { useWebGateStatus } from '@/hooks/useIsMobileWeb';
import { DesktopWebBlock } from './DesktopWebBlock';
import { TabletLandscapeBlock } from './TabletLandscapeBlock';

interface MobileOnlyGateProps {
  children: React.ReactNode;
}

/**
 * On web, blocks desktop and tablet landscape; allows iPhone (any orientation) and iPad portrait.
 * Native iOS/Android builds are unaffected.
 */
export function MobileOnlyGate({ children }: MobileOnlyGateProps) {
  const gateStatus = useWebGateStatus();
  const [devBypass, setDevBypass] = useState(false);

  if (Platform.OS === 'web' && !devBypass) {
    if (gateStatus === 'desktop') {
      return <DesktopWebBlock onDevBypass={() => setDevBypass(true)} />;
    }
    if (gateStatus === 'tablet-landscape') {
      return <TabletLandscapeBlock />;
    }
  }

  return <>{children}</>;
}
