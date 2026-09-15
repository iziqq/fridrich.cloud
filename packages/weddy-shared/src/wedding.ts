import {
  optionalEmailText,
  optionalIsoDate,
  optionalText,
  requiredText,
} from '@fridrich/shared';
import * as v from 'valibot';

/*
 * Subdoména `wedding` – plánování svatby jako celek a snoubenci.
 *
 * Snoubenci nejsou samostatný záznam: ženich a nevěsta jsou hodnotové
 * objekty uvnitř svatby a edituje se s nimi i název a datum (jeden formulář,
 * jeden dokument v databázi).
 */

const NAME_MAX = 100;
const TITLE_MAX = 200;
const PHONE_MAX = 40;
const NOTE_MAX = 2000;
const MIN_BIRTH_YEAR = 1900;

/* --- Snoubenec --- */

export const PersonSchema = v.object({
  firstName: v.string(),
  lastName: v.string(),
  birthYear: v.optional(v.number()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  note: v.optional(v.string()),
});
export type Person = v.InferOutput<typeof PersonSchema>;

function birthYearMessage(): string {
  return `Rok narození musí být mezi ${MIN_BIRTH_YEAR} a ${new Date().getUTCFullYear()}`;
}

/** Údaje snoubence z formuláře. Rok narození nesmí být v budoucnu. */
export const PersonInputSchema = v.object(
  {
    firstName: requiredText('Vyplňte jméno', NAME_MAX, `Jméno může mít nejvýše ${NAME_MAX} znaků`),
    lastName: requiredText(
      'Vyplňte příjmení',
      NAME_MAX,
      `Příjmení může mít nejvýše ${NAME_MAX} znaků`,
    ),
    birthYear: v.optional(
      v.pipe(
        v.number(birthYearMessage),
        v.integer(birthYearMessage),
        v.minValue(MIN_BIRTH_YEAR, birthYearMessage),
        v.check((year) => year <= new Date().getUTCFullYear(), birthYearMessage),
      ),
    ),
    email: optionalEmailText('Zadejte platný e-mail'),
    phone: optionalText(PHONE_MAX, 'Telefon je příliš dlouhý'),
    note: optionalText(NOTE_MAX, 'Poznámka je příliš dlouhá'),
  },
  'Vyplňte údaje snoubence',
);
export type PersonInput = v.InferOutput<typeof PersonInputSchema>;

/* --- Svatba --- */

export const WeddingSchema = v.object({
  id: v.string(),
  title: v.string(),
  /** ISO 8601 (YYYY-MM-DD). */
  weddingDate: v.optional(v.string()),
  groom: PersonSchema,
  bride: PersonSchema,
  createdAt: v.string(),
  updatedAt: v.string(),
});
export type Wedding = v.InferOutput<typeof WeddingSchema>;

/** Vstup pro založení i úpravu svatby – název, datum a oba snoubenci. */
export const WeddingInputSchema = v.object({
  title: requiredText(
    'Vyplňte název svatby',
    TITLE_MAX,
    `Název může mít nejvýše ${TITLE_MAX} znaků`,
  ),
  weddingDate: optionalIsoDate('Datum musí být ve formátu RRRR-MM-DD'),
  groom: PersonInputSchema,
  bride: PersonInputSchema,
});
export type WeddingInput = v.InferOutput<typeof WeddingInputSchema>;

/** Karta svatby na dashboardu. */
export const WeddingSummarySchema = v.object({
  ...WeddingSchema.entries,
  guestCount: v.number(),
  acceptedGuestCount: v.number(),
  budgetTotal: v.number(),
  /** Počet dní do svatby; chybí, pokud datum není vyplněné. */
  daysUntilWedding: v.optional(v.number()),
});
export type WeddingSummary = v.InferOutput<typeof WeddingSummarySchema>;

/** Počet celých dní do svatby; záporné číslo znamená, že už proběhla. */
export function daysUntil(isoDate: string | undefined, now = new Date()): number | undefined {
  if (!isoDate) return undefined;
  const target = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return undefined;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target.getTime() - today) / 86_400_000);
}
