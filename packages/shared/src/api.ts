import * as v from 'valibot';

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

export const ApiErrorCodeSchema = v.picklist(API_ERROR_CODES);
export type ApiErrorCode = v.InferOutput<typeof ApiErrorCodeSchema>;

/** Jedno pole, na kterém selhala validace (`groom.firstName`, `members.0.ageGroup`). */
export const ApiErrorDetailSchema = v.object({
  field: v.string(),
  message: v.string(),
});
export type ApiErrorDetail = v.InferOutput<typeof ApiErrorDetailSchema>;

/**
 * Jednotný tvar chybové odpovědi API.
 *
 * `error` je schválně obecný `string`, ne výčet – frontend musí přežít i kód,
 * který backend přidá dřív, než se nasadí nový frontend.
 */
export const ApiErrorBodySchema = v.object({
  error: v.string(),
  message: v.string(),
  details: v.optional(v.array(ApiErrorDetailSchema)),
});
export type ApiErrorBody = v.InferOutput<typeof ApiErrorBodySchema>;

/** Odpověď endpointů, které nevrací data, jen hlášku pro uživatele. */
export const MessageResponseSchema = v.object({
  message: v.string(),
});
export type MessageResponse = v.InferOutput<typeof MessageResponseSchema>;
