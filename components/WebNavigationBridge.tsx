import { useWebSwipeBack } from '@/hooks/useWebSwipeBack';

/** Web-only: edge swipe back + shared navigation helpers. */
export function WebNavigationBridge() {
  useWebSwipeBack();
  return null;
}
