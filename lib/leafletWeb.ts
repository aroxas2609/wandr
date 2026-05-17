/** Ensure Leaflet CSS is loaded on web (Metro often skips CSS imports). */
export function ensureLeafletCss(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('wandr-leaflet-css')) return;

  const link = document.createElement('link');
  link.id = 'wandr-leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}
