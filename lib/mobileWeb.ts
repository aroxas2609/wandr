/** Max viewport width treated as a phone/tablet portrait web client. */
export const MOBILE_WEB_MAX_WIDTH = 768;

export function isMobileWebViewport(platform: string, width: number): boolean {
  if (platform !== 'web') return true;
  return width < MOBILE_WEB_MAX_WIDTH;
}
