import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models';

/** Message lisible pour l'utilisateur à partir d'une erreur HTTP de l'API. */
export function errorMessage(err: unknown, fallback = 'Une erreur est survenue. Réessayez.'): string {
  if (!(err instanceof HttpErrorResponse)) return fallback;
  if (err.status === 0) return 'Serveur injoignable. Vérifiez que le backend est démarré.';
  const body = err.error as ApiError | null;
  if (body?.violations?.length) {
    return body.violations.map((v) => `${v.field} : ${v.message}`).join(' · ');
  }
  return body?.message || fallback;
}
