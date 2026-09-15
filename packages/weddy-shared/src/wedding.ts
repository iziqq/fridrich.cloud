import {
  messageKeys,
  optionalEmailText,
  optionalIsoDate,
  optionalText,
  requiredText,
  type Catalog,
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

const cs = {
  firstNameRequired: 'Vyplňte jméno',
  firstNameTooLong: `Jméno může mít nejvýše ${NAME_MAX} znaků`,
  lastNameRequired: 'Vyplňte příjmení',
  lastNameTooLong: `Příjmení může mít nejvýše ${NAME_MAX} znaků`,
  birthYearInvalid: `Rok narození musí být mezi ${MIN_BIRTH_YEAR} a letošním rokem`,
  emailInvalid: 'Zadejte platný e-mail',
  phoneTooLong: 'Telefon je příliš dlouhý',
  noteTooLong: 'Poznámka je příliš dlouhá',
  personRequired: 'Vyplňte údaje snoubence',
  titleRequired: 'Vyplňte název svatby',
  titleTooLong: `Název může mít nejvýše ${TITLE_MAX} znaků`,
  dateInvalid: 'Datum musí být ve formátu RRRR-MM-DD',
  notFound: 'Plánování neexistuje',
  forbidden: 'K tomuto plánování nemáte přístup',
  lastOwner: 'Posledního vlastníka nejde odebrat – plánování je potřeba smazat',
};

const en: Catalog<typeof cs> = {
  firstNameRequired: 'Please enter the first name',
  firstNameTooLong: `The first name can have at most ${NAME_MAX} characters`,
  lastNameRequired: 'Please enter the last name',
  lastNameTooLong: `The last name can have at most ${NAME_MAX} characters`,
  birthYearInvalid: `The year of birth must be between ${MIN_BIRTH_YEAR} and this year`,
  emailInvalid: 'Please enter a valid e-mail',
  phoneTooLong: 'The phone number is too long',
  noteTooLong: 'The note is too long',
  personRequired: 'Please fill in the details of the partner',
  titleRequired: 'Please enter the name of the wedding',
  titleTooLong: `The name can have at most ${TITLE_MAX} characters`,
  dateInvalid: 'The date must be in the YYYY-MM-DD format',
  notFound: 'The wedding plan does not exist',
  forbidden: 'You do not have access to this wedding plan',
  lastOwner: 'The last owner cannot be removed – the wedding plan has to be deleted',
};

/** Hlášky subdomény `wedding` – jmenný prostor `weddyShared.wedding`. */
export const weddingMessages = { cs, en };
export const weddingKeys = messageKeys(cs, 'weddyShared.wedding');

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

/** Údaje snoubence z formuláře. Rok narození nesmí být v budoucnu. */
export const PersonInputSchema = v.object(
  {
    firstName: requiredText(weddingKeys.firstNameRequired, NAME_MAX, weddingKeys.firstNameTooLong),
    lastName: requiredText(weddingKeys.lastNameRequired, NAME_MAX, weddingKeys.lastNameTooLong),
    birthYear: v.optional(
      v.pipe(
        v.number(weddingKeys.birthYearInvalid),
        v.integer(weddingKeys.birthYearInvalid),
        v.minValue(MIN_BIRTH_YEAR, weddingKeys.birthYearInvalid),
        v.check((year) => year <= new Date().getUTCFullYear(), weddingKeys.birthYearInvalid),
      ),
    ),
    email: optionalEmailText(weddingKeys.emailInvalid),
    phone: optionalText(PHONE_MAX, weddingKeys.phoneTooLong),
    note: optionalText(NOTE_MAX, weddingKeys.noteTooLong),
  },
  weddingKeys.personRequired,
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
  title: requiredText(weddingKeys.titleRequired, TITLE_MAX, weddingKeys.titleTooLong),
  weddingDate: optionalIsoDate(weddingKeys.dateInvalid),
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
