export const TRIP_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'GBP', symbol: '£', label: 'GBP' },
  { code: 'JPY', symbol: '¥', label: 'JPY' },
  { code: 'CAD', symbol: 'C$', label: 'CAD' },
  { code: 'AUD', symbol: 'A$', label: 'AUD' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF' },
  { code: 'MXN', symbol: 'MX$', label: 'MXN' },
  { code: 'SGD', symbol: 'S$', label: 'SGD' },
  { code: 'HKD', symbol: 'HK$', label: 'HKD' },
] as const;

export type TripCurrencyCode = (typeof TRIP_CURRENCIES)[number]['code'];

export function getCurrencySymbol(code: string): string {
  return TRIP_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
