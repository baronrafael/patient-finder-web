import { HttpErrorResponse } from '@angular/common/http';

export function mapHttpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const apiMessage = readApiErrorMessage(error);
    if (apiMessage) {
      return apiMessage;
    }

    if (error.status === 409) {
      return 'Ya existe un paciente con esos datos. Revisa la lista o edita el registro existente.';
    }

    if (error.status === 403) {
      return 'No tienes permiso para realizar esta acción.';
    }

    if (error.status >= 400 && error.status < 500) {
      return 'No pudimos completar la solicitud. Revisa los datos e intenta de nuevo.';
    }

    return 'No pudimos cargar la información en este momento. Intenta nuevamente.';
  }

  return 'Ocurrió un error inesperado. Intenta nuevamente.';
}

function readApiErrorMessage(error: HttpErrorResponse): string | null {
  const body = error.error;

  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }

  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  return null;
}
