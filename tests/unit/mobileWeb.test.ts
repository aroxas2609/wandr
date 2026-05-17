import {
  getWebGateStatus,
  isMobileWebViewport,
  parseWebDevice,
} from '@/lib/mobileWeb';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const IPAD_UA =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const IPAD_MAC_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';
const ANDROID_PHONE_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36';
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';

describe('mobile web gate', () => {
  it('allows native platforms regardless of size', () => {
    expect(isMobileWebViewport('ios', 1200, 800)).toBe(true);
    expect(isMobileWebViewport('android', 1200, 800)).toBe(true);
  });

  it('detects iPhone, iPad, and Android from user agent', () => {
    expect(parseWebDevice(IPHONE_UA, 5)).toBe('iphone');
    expect(parseWebDevice(IPAD_UA, 5)).toBe('ipad');
    expect(parseWebDevice(IPAD_MAC_UA, 5)).toBe('ipad');
    expect(parseWebDevice(ANDROID_PHONE_UA, 5)).toBe('android-phone');
    expect(parseWebDevice(DESKTOP_UA, 0)).toBe('desktop');
  });

  it('allows iPhone in portrait and landscape', () => {
    expect(getWebGateStatus('web', 390, 844, IPHONE_UA, 5)).toBe('allowed');
    expect(getWebGateStatus('web', 844, 390, IPHONE_UA, 5)).toBe('allowed');
  });

  it('allows iPad portrait but blocks iPad landscape', () => {
    expect(getWebGateStatus('web', 820, 1180, IPAD_UA, 5)).toBe('allowed');
    expect(getWebGateStatus('web', 1180, 820, IPAD_UA, 5)).toBe('tablet-landscape');
    expect(getWebGateStatus('web', 1180, 820, IPAD_MAC_UA, 5)).toBe('tablet-landscape');
    expect(getWebGateStatus('web', 820, 1180, IPAD_MAC_UA, 5)).toBe('allowed');
  });

  it('blocks desktop browsers', () => {
    expect(getWebGateStatus('web', 1440, 900, DESKTOP_UA, 0)).toBe('desktop');
  });
});
