import { formatResultCount } from './format-result-count';

export function formatResultProgress(shown: number, total: number): string {
  if (shown >= total) {
    return `Mostrando ${formatResultCount(total)}`;
  }

  return `Mostrando ${shown} de ${total} coincidencias`;
}
