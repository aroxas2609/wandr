import { router, type Href } from 'expo-router';

/** Parent route when there is no history stack (common on web refresh). */
export function inferBackHref(pathname: string): Href | null {
  const tripSubpage = pathname.match(/^\/trip\/([^/]+)\/(.+)$/);
  if (tripSubpage) {
    return `/trip/${tripSubpage[1]}`;
  }

  if (/^\/trip\/[^/]+$/.test(pathname)) {
    return '/(tabs)/trips';
  }

  if (pathname === '/trip/new' || pathname.startsWith('/trip/new')) {
    return '/(tabs)/trips';
  }

  if (pathname === '/settings') {
    return '/(tabs)/profile';
  }

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/(auth)/')
  ) {
    return '/(auth)/welcome';
  }

  return null;
}

export function navigateBack(fallbackHref?: Href): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  const inferred =
    fallbackHref ??
    (typeof window !== 'undefined' ? inferBackHref(window.location.pathname) : null);

  if (inferred) {
    router.replace(inferred);
    return;
  }

  router.replace('/(tabs)');
}
