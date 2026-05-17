import { isMobileWebViewport, MOBILE_WEB_MAX_WIDTH } from '@/lib/mobileWeb';

describe('mobile web gate', () => {
  it('allows native platforms regardless of width', () => {
    expect(isMobileWebViewport('ios', 1200)).toBe(true);
    expect(isMobileWebViewport('android', 1200)).toBe(true);
  });

  it('blocks wide web viewports', () => {
    expect(isMobileWebViewport('web', MOBILE_WEB_MAX_WIDTH)).toBe(false);
    expect(isMobileWebViewport('web', MOBILE_WEB_MAX_WIDTH - 1)).toBe(true);
  });
});
