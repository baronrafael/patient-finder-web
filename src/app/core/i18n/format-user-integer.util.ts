export function formatUserInteger(value: number): string {
  return new Intl.NumberFormat(undefined).format(value);
}
