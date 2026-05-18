import { isAndroidWeb, isIosWeb, isPwaStandalone } from '@/lib/pwaInstall';

describe('pwaInstall', () => {
  it('returns false on native', () => {
    expect(isPwaStandalone()).toBe(false);
    expect(isIosWeb()).toBe(false);
    expect(isAndroidWeb()).toBe(false);
  });
});
