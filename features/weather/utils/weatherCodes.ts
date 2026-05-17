/** WMO weather interpretation codes (Open-Meteo). */
const WMO_LABELS: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};

export function weatherCodeToCondition(code: number): string {
  if (WMO_LABELS[code]) return WMO_LABELS[code];
  if (code >= 56 && code <= 57) return 'Freezing drizzle';
  if (code >= 66 && code <= 67) return 'Freezing rain';
  if (code >= 77 && code <= 77) return 'Snow grains';
  if (code >= 85 && code <= 86) return 'Snow showers';
  return 'Variable';
}
