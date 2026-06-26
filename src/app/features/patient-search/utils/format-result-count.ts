export function formatResultCount(count: number): string {
  return `${count} coincidencia${count === 1 ? '' : 's'}`;
}
