/** Jedno pole, na kterém selhala validace. */
export interface ApiErrorDetail {
  field: string;
  message: string;
}

/** Jednotný tvar chybové odpovědi API (doc/iziweddy.md, kap. 7.6). */
export interface ApiErrorBody {
  error: string;
  message: string;
  details?: ApiErrorDetail[];
}

/** Kódy chyb, na které se frontend může spolehnout. */
export const API_ERROR_CODES = [
  'ValidationError',
  'Unauthorized',
  'Forbidden',
  'NotFound',
  'Conflict',
  'TooManyRequests',
  'InternalServerError',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
