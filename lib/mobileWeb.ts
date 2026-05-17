export type WebDeviceClass =
  | 'iphone'
  | 'ipad'
  | 'android-phone'
  | 'android-tablet'
  | 'desktop';

export type WebGateStatus = 'allowed' | 'desktop' | 'tablet-landscape';

/** @deprecated Use device/orientation rules in getWebGateStatus instead. */
export const MOBILE_WEB_MAX_WIDTH = 768;

export function parseWebDevice(userAgent: string, maxTouchPoints: number): WebDeviceClass {
  const ua = userAgent;

  if (/iPhone|iPod/i.test(ua)) return 'iphone';
  if (/iPad/i.test(ua)) return 'ipad';
  // iPadOS 13+ reports as Mac with touch
  if (/Macintosh/i.test(ua) && maxTouchPoints > 1) return 'ipad';

  if (/Android/i.test(ua)) {
    return /Mobile/i.test(ua) ? 'android-phone' : 'android-tablet';
  }

  return 'desktop';
}

export function getWebGateStatus(
  platform: string,
  width: number,
  height: number,
  userAgent = '',
  maxTouchPoints = 0
): WebGateStatus {
  if (platform !== 'web') return 'allowed';

  const portrait = height >= width;
  const device = parseWebDevice(userAgent, maxTouchPoints);
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);

  if (device === 'iphone' || device === 'android-phone') {
    return 'allowed';
  }

  if (device === 'ipad' || device === 'android-tablet') {
    return portrait ? 'allowed' : 'tablet-landscape';
  }

  // Touch devices without a recognized phone/tablet UA (rare); allow phone-sized layouts.
  if (maxTouchPoints > 0 && minSide < 520 && maxSide <= 960) {
    return 'allowed';
  }

  return 'desktop';
}

export function isMobileWebViewport(
  platform: string,
  width: number,
  height: number,
  userAgent = '',
  maxTouchPoints = 0
): boolean {
  return getWebGateStatus(platform, width, height, userAgent, maxTouchPoints) === 'allowed';
}
