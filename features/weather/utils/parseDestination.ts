/** ISO 3166-1 alpha-2 codes for common destination country names. */
const COUNTRY_ALIASES: Record<string, string> = {
  'new zealand': 'NZ',
  nz: 'NZ',
  japan: 'JP',
  jp: 'JP',
  australia: 'AU',
  au: 'AU',
  'united states': 'US',
  usa: 'US',
  us: 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  france: 'FR',
  italy: 'IT',
  spain: 'ES',
  germany: 'DE',
  canada: 'CA',
  mexico: 'MX',
  brazil: 'BR',
  india: 'IN',
  china: 'CN',
  'south korea': 'KR',
  korea: 'KR',
  thailand: 'TH',
  vietnam: 'VN',
  indonesia: 'ID',
  singapore: 'SG',
  malaysia: 'MY',
  philippines: 'PH',
  iceland: 'IS',
  norway: 'NO',
  sweden: 'SE',
  switzerland: 'CH',
  netherlands: 'NL',
  belgium: 'BE',
  portugal: 'PT',
  greece: 'GR',
  turkey: 'TR',
  egypt: 'EG',
  'south africa': 'ZA',
  uae: 'AE',
  'united arab emirates': 'AE',
  ireland: 'IE',
  argentina: 'AR',
  chile: 'CL',
  peru: 'PE',
  colombia: 'CO',
};

/** City / place string used for geocoding (first segment before comma). */
export function geocodeQueryFromDestination(destination: string): string {
  const trimmed = destination.trim();
  if (!trimmed) return '';
  const first = trimmed.split(',')[0]?.trim();
  return first || trimmed;
}

/**
 * Country hint from destination (last comma-separated segment), e.g. "Queenstown, New Zealand" → NZ.
 */
export function countryCodeFromDestination(destination: string): string | undefined {
  const parts = destination
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return undefined;

  const countryPart = parts[parts.length - 1].toLowerCase();
  return COUNTRY_ALIASES[countryPart];
}

/** Short label for weather cards. */
export function displayCityFromDestination(destination: string): string {
  return geocodeQueryFromDestination(destination) || destination.trim();
}
