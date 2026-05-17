/** Coerce empty strings / NaN to null for optional Postgres columns. */
export function emptyToNull<T>(value: T | string | null | undefined): T | null {
  if (value === undefined || value === null || value === '') return null;
  return value as T;
}

export function numberToNull(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return value;
}
