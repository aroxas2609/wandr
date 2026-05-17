/** Expo Router may return string | string[] for search params. */
export function resolveSearchParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
