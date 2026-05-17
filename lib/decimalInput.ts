/** Keeps only digits and a single decimal point while the user types. */
export function sanitizeDecimalInput(text: string): string {
  let cleaned = text.replace(/[^0-9.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    const before = cleaned.slice(0, dotIndex + 1);
    const after = cleaned.slice(dotIndex + 1).replace(/\./g, '');
    cleaned = before + after;
  }
  return cleaned;
}

export function parseDecimalInput(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '' || trimmed === '.') return undefined;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : undefined;
}
