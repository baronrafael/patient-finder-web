export function normalizeDocument(value: string): string {
  return value.replace(/\D/g, '');
}
