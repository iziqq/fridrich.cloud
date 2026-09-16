import {
  emailText,
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
  role: { admin: 'Admin', manager: 'Manager', viewer: 'Viewer' },
  roleHint: {
    admin: 'Zakladatel plánování. Může všechno včetně nastavení, přístupů a smazání.',
    manager: 'Může upravovat snoubence, hosty i plánování. Nastavení nevidí.',
    viewer: 'Vidí celé plánování, ale nemůže nic měnit.',
  },
  roleInvalid: 'Neplatná role',
  editForbidden: 'Tohle plánování máte jen ke čtení',
  settingsForbidden: 'Nastavení plánování může měnit jen admin',
  alreadyMember: 'Tenhle člověk už k plánování přístup má',
  alreadyInvited: 'Pozvánka na tenhle e-mail už čeká na přijetí',
  cannotInviteSelf: 'Sebe zvát nemusíte',
  memberNotFound: 'Tenhle člen k plánování nepatří',
  invitationNotFound: 'Pozvánka neexistuje',
  adminRoleFixed: 'Roli admina nejde změnit ani odebrat – je to zakladatel plánování',
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
  role: { admin: 'Admin', manager: 'Manager', viewer: 'Viewer' },
  roleHint: {
    admin: 'The person who created the plan. Can do everything, including settings, access and deletion.',
    manager: 'Can edit the couple, guests and planning. Does not see the settings.',
    viewer: 'Sees the whole plan but cannot change anything.',
  },
  roleInvalid: 'Invalid role',
  editForbidden: 'You have read-only access to this wedding plan',
  settingsForbidden: 'Only the admin can change the settings of the plan',
  alreadyMember: 'This person already has access to the plan',
  alreadyInvited: 'An invitation to this e-mail is already waiting',
  cannotInviteSelf: 'There is no need to invite yourself',
  memberNotFound: 'This member does not belong to the plan',
  invitationNotFound: 'The invitation does not exist',
  adminRoleFixed: 'The admin role cannot be changed or removed – it is the creator of the plan',
};

/** Hlášky subdomény `wedding` – jmenný prostor `weddyShared.wedding`. */
export const weddingMessages = { cs, en };
export const weddingKeys = messageKeys(cs, 'weddyShared.wedding');

/* --- Role a přístup --- */

/**
 * Role v plánování.
 *
 * `admin` je zakladatel: jediný vidí nastavení, spravuje přístupy a smí
 * plánování smazat. `manager` mění obsah (snoubenci, hosté, plánování),
 * `viewer` jen čte. Role je vlastnost dvojice uživatel–plánování, ne účtu.
 */
export const WEDDING_ROLES = ['admin', 'manager', 'viewer'] as const;
export const WeddingRoleSchema = v.picklist(WEDDING_ROLES, weddingKeys.roleInvalid);
export type WeddingRole = v.InferOutput<typeof WeddingRoleSchema>;

/** Admina zvát nejde – tím je vždy zakladatel plánování. */
export const INVITABLE_ROLES = ['manager', 'viewer'] as const;
export const InvitableRoleSchema = v.picklist(INVITABLE_ROLES, weddingKeys.roleInvalid);
export type InvitableRole = v.InferOutput<typeof InvitableRoleSchema>;

/** Smí měnit obsah plánování (snoubenci, hosté, položky)? */
export function canEditWedding(role: WeddingRole): boolean {
  return role === 'admin' || role === 'manager';
}

/** Smí do nastavení – název a datum, přístupy, smazání plánování? */
export function canManageWeddingSettings(role: WeddingRole): boolean {
  return role === 'admin';
}

export const WeddingMemberSchema = v.object({
  userId: v.string(),
  displayName: v.string(),
  email: v.string(),
  role: WeddingRoleSchema,
  addedAt: v.string(),
});
export type WeddingMember = v.InferOutput<typeof WeddingMemberSchema>;

/** Pozvánka pro e-mail, ke kterému zatím nepatří žádný účet. */
export const WeddingInvitationSchema = v.object({
  id: v.string(),
  email: v.string(),
  role: InvitableRoleSchema,
  invitedAt: v.string(),
  expiresAt: v.string(),
});
export type WeddingInvitation = v.InferOutput<typeof WeddingInvitationSchema>;

export const WeddingAccessSchema = v.object({
  members: v.array(WeddingMemberSchema),
  invitations: v.array(WeddingInvitationSchema),
});
export type WeddingAccess = v.InferOutput<typeof WeddingAccessSchema>;

export const InviteToWeddingInputSchema = v.object({
  email: emailText(weddingKeys.emailInvalid),
  role: InvitableRoleSchema,
});
export type InviteToWeddingInput = v.InferOutput<typeof InviteToWeddingInputSchema>;

export const ChangeWeddingRoleInputSchema = v.object({ role: InvitableRoleSchema });
export type ChangeWeddingRoleInput = v.InferOutput<typeof ChangeWeddingRoleInputSchema>;

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

/** Detail plánování i s rolí přihlášeného uživatele – podle ní frontend skrývá ovládání. */
export const WeddingDetailSchema = v.object({
  ...WeddingSchema.entries,
  role: WeddingRoleSchema,
});
export type WeddingDetail = v.InferOutput<typeof WeddingDetailSchema>;

/** Nastavení plánování – název a datum. Mění je jen admin v Nastavení. */
export const WeddingSettingsInputSchema = v.object({
  title: requiredText(weddingKeys.titleRequired, TITLE_MAX, weddingKeys.titleTooLong),
  weddingDate: optionalIsoDate(weddingKeys.dateInvalid),
});
export type WeddingSettingsInput = v.InferOutput<typeof WeddingSettingsInputSchema>;

/** Snoubenci – obrazovka Snoubenci, mění je admin i manager. */
export const CoupleInputSchema = v.object({
  groom: PersonInputSchema,
  bride: PersonInputSchema,
});
export type CoupleInput = v.InferOutput<typeof CoupleInputSchema>;

/** Založení plánování – nastavení i snoubenci v jednom formuláři. */
export const WeddingInputSchema = v.object({
  ...WeddingSettingsInputSchema.entries,
  ...CoupleInputSchema.entries,
});
export type WeddingInput = v.InferOutput<typeof WeddingInputSchema>;

/** Karta svatby na dashboardu. */
export const WeddingSummarySchema = v.object({
  ...WeddingSchema.entries,
  guestCount: v.number(),
  acceptedGuestCount: v.number(),
  budgetTotal: v.number(),
  /** Sekce plánování, ve kterých je aspoň jedna schválená položka (z `PLANNING_CATEGORIES`). */
  decidedSectionCount: v.number(),
  /** Role přihlášeného uživatele v tomhle plánování. */
  role: WeddingRoleSchema,
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
