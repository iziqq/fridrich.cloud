import * as v from 'valibot';
import type { ApiErrorDetail } from './api.js';
import { messageKeys, type Catalog } from './i18n.js';

const cs = {
  invalidData: 'Neplatná data',
  fieldRequired: 'Vyplňte toto pole',
};

const en: Catalog<typeof cs> = {
  invalidData: 'Invalid data',
  fieldRequired: 'Please fill in this field',
};

/** Obecné hlášky validace – jmenný prostor `shared.common`. */
export const commonMessages = { cs, en };
export const commonKeys = messageKeys(cs, 'shared.common');

/**
 * Stavební kameny validace nad Valibotem.
 *
 * Z nich se skládají schémata domén (`@fridrich/weddy-shared`, `identity.ts`)
 * i schémata endpointů. Stejné pravidlo tak platí ve formuláři na frontendu,
 * při parsování požadavku na backendu i v doméně – je napsané jen jednou.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_MAX = 254;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= EMAIL_MAX && EMAIL_RE.test(trimmed);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Platné datum ve formátu YYYY-MM-DD včetně kontroly, že den existuje. */
export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Povinný text – ořízne mezery, prázdný neprojde, dlouhý taky ne. */
export function requiredText(requiredMessage: string, max: number, tooLongMessage: string) {
  return v.pipe(
    v.string(requiredMessage),
    v.trim(),
    v.nonEmpty(requiredMessage),
    v.maxLength(max, tooLongMessage),
  );
}

/** Nepovinný text – ořízne mezery a prázdný řetězec převede na `undefined`. */
export function optionalText(max: number, tooLongMessage: string) {
  return v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(max, tooLongMessage),
      v.transform((value) => (value === '' ? undefined : value)),
    ),
  );
}

/** E-mail normalizovaný na malá písmena – `Jan@…` a `jan@…` je tatáž adresa. */
export function emailText(message: string) {
  return v.pipe(
    v.string(message),
    v.trim(),
    v.toLowerCase(),
    v.nonEmpty(message),
    v.maxLength(EMAIL_MAX, message),
    v.regex(EMAIL_RE, message),
  );
}

/** Nepovinný e-mail – prázdné pole projde jako `undefined`. */
export function optionalEmailText(message: string) {
  return v.optional(
    v.pipe(
      v.string(message),
      v.trim(),
      v.toLowerCase(),
      v.transform((value) => (value === '' ? undefined : value)),
      v.check((value) => value === undefined || isValidEmail(value), message),
    ),
  );
}

/** Nepovinný odkaz – jen `http://` a `https://`, ať se do stránky nedostane `javascript:`. */
export function optionalHttpUrl(max: number, message: string) {
  return v.optional(
    v.pipe(
      v.string(message),
      v.trim(),
      v.transform((value) => (value === '' ? undefined : value)),
      v.check(
        (value) => value === undefined || (value.length <= max && isValidHttpUrl(value)),
        message,
      ),
    ),
  );
}

/** Nepovinné datum ve tvaru YYYY-MM-DD; kontroluje i to, že den v kalendáři existuje. */
export function optionalIsoDate(message: string) {
  return v.optional(
    v.pipe(
      v.string(message),
      v.trim(),
      v.transform((value) => (value === '' ? undefined : value)),
      v.check((value) => value === undefined || isValidIsoDate(value), message),
    ),
  );
}

/**
 * Převede issues z Valibotu na detaily chybové odpovědi API.
 *
 * Pole se pojmenuje tečkovou cestou (`groom.firstName`), takže ho formulář
 * najde bez překládání. Na jedno pole se bere jen první chyba – uživatel ji
 * opraví a teprve pak má smysl ukazovat další.
 *
 * Úplně chybějící klíč hlásí Valibot za objekt, ne za pole – hláška ze
 * schématu pole se nepoužije a výchozí je anglická věta. Nahradí se klíčem
 * obecné hlášky, ať ji frontend přeloží stejně jako ostatní.
 */
export function issuesToDetails(issues: readonly v.BaseIssue<unknown>[]): ApiErrorDetail[] {
  const details: ApiErrorDetail[] = [];
  const seen = new Set<string>();

  for (const issue of issues) {
    const field = v.getDotPath(issue) ?? '';
    if (seen.has(field)) continue;

    const missingKey = issue.kind === 'schema' && issue.type === 'object' && field !== '';
    seen.add(field);
    details.push({ field, message: missingKey ? commonKeys.fieldRequired : issue.message });
  }

  return details;
}
