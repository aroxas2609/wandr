/** Read iOS/Android safe-area insets from CSS env() on web (PWA standalone). */
export function readWebSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof document === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const probe = document.createElement('div');
  probe.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'visibility: hidden',
    'pointer-events: none',
    'padding-top: env(safe-area-inset-top)',
    'padding-right: env(safe-area-inset-right)',
    'padding-bottom: env(safe-area-inset-bottom)',
    'padding-left: env(safe-area-inset-left)',
  ].join(';');
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const insets = {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
  document.body.removeChild(probe);
  return insets;
}
