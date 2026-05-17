import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { usePathname } from 'expo-router';
import { navigateBack } from '@/lib/navigation';

const EDGE_WIDTH_PX = 28;
const SWIPE_THRESHOLD_PX = 56;
const MAX_VERTICAL_DRIFT_PX = 80;

/**
 * Edge swipe-to-go-back on mobile web (iOS Safari / Android Chrome).
 * Native stack gestures do not run in the browser; browser history may be shallow
 * when screens use replace(), so we handle the gesture in-app.
 */
export function useWebSwipeBack(): void {
  const pathname = usePathname();
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touch.clientX > EDGE_WIDTH_PX) return;
      touchRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (event: TouchEvent) => {
      const start = touchRef.current;
      touchRef.current = null;
      if (!start) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = Math.abs(touch.clientY - start.y);

      if (deltaX >= SWIPE_THRESHOLD_PX && deltaY <= MAX_VERTICAL_DRIFT_PX) {
        navigateBack();
      }
    };

    const onTouchCancel = () => {
      touchRef.current = null;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [pathname]);
}
