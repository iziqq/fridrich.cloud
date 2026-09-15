import * as v from 'valibot';
import { messageKeys, type Catalog } from './i18n.js';

const cs = {
  unauthorized: 'Přihlaste se prosím',
  forbidden: 'K tomuto obsahu nemáte přístup',
  notFound: 'Záznam neexistuje',
  conflict: 'Operaci nejde provést',
  tooManyRequests: 'Příliš mnoho pokusů. Zkuste to za chvíli.',
  methodNotAllowed: 'Tato operace není na této adrese podporovaná',
  serverError: 'Neočekávaná chyba serveru',
  requestFailed: 'Požadavek selhal. Zkuste to prosím znovu.',
  invalidResponse: 'Server vrátil neočekávaná data.',
  unexpected: 'Něco se pokazilo. Zkuste to prosím znovu.',
};

const en: Catalog<typeof cs> = {
  unauthorized: 'Please sign in',
  forbidden: 'You do not have access to this content',
  notFound: 'The record does not exist',
  conflict: 'This operation cannot be done',
  tooManyRequests: 'Too many attempts. Please try again in a moment.',
  methodNotAllowed: 'This operation is not supported at this address',
  serverError: 'Unexpected server error',
  requestFailed: 'The request failed. Please try again.',
  invalidResponse: 'The server returned unexpected data.',
  unexpected: 'Something went wrong. Please try again.',
};

/** Obecné chyby API a HTTP klienta – jmenný prostor `shared.errors`. */
export const errorMessages = { cs, en };
export const errorKeys = messageKeys(cs, 'shared.errors');

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

/** Jedno pole, na kterém selhala validace (`groom.firstName`, `members.0.ageGroup`); `message` je klíč hlášky. */
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
  // `message` je klíč hlášky (`shared.errors.notFound`) – text podle jazyka doplní frontend.
  error: v.string(),
  message: v.string(),
  details: v.optional(v.array(ApiErrorDetailSchema)),
});
export type ApiErrorBody = v.InferOutput<typeof ApiErrorBodySchema>;

/** Odpověď endpointů, které nevrací data, jen hlášku pro uživatele – `message` je klíč. */
export const MessageResponseSchema = v.object({
  message: v.string(),
});
export type MessageResponse = v.InferOutput<typeof MessageResponseSchema>;
