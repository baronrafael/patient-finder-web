import { HttpErrorResponse } from '@angular/common/http';

export function mapHttpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return 'No pudimos cargar la información en este momento. Intenta nuevamente.';
  }

  return 'Ocurrió un error inesperado. Intenta nuevamente.';
}
