export function normalize_language_code(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized || 'auto';
}

export function normalize_language_name(value: string): string {
  const normalized = value.trim();
  return normalized || 'auto';
}
