import { optionalText, requiredText } from '@fridrich/shared';
import * as v from 'valibot';

/*
 * Subdoména `guests` – hosté a rodiny.
 *
 * Rodina nemá vlastní záznam: je to skupina hostů se stejným `family.id`.
 * Díky tomu zůstává strana na hostovi, takže filtry i statistiky fungují
 * beze změny a strana rodiny se nemůže rozejít se stranou jejích členů.
 */

const NAME_MAX = 100;
const NOTE_MAX = 2000;
const FAMILY_NAME_MAX = 100;
const FAMILY_MEMBERS_MAX = 30;

/* --- Výčty --- */

export const GUEST_SIDES = ['groom', 'bride'] as const;
export const AGE_GROUPS = ['adult', 'child'] as const;
export const GUEST_STATUSES = ['draft', 'requested', 'accepted', 'rejected'] as const;

/** Strana hosta – ke komu host patří. */
export const GuestSideSchema = v.picklist(GUEST_SIDES, 'Vyberte, na čí straně host je');
export type GuestSide = v.InferOutput<typeof GuestSideSchema>;

/** Věková skupina hosta. */
export const AgeGroupSchema = v.picklist(AGE_GROUPS, 'Neplatná věková skupina');
export type AgeGroup = v.InferOutput<typeof AgeGroupSchema>;

/** Stav pozvánky. Přechody se nevynucují – uživatel musí jít opravit překlep. */
export const GuestStatusSchema = v.picklist(GUEST_STATUSES, 'Neplatný stav hosta');
export type GuestStatus = v.InferOutput<typeof GuestStatusSchema>;

export const GUEST_SIDE_LABELS: Record<GuestSide, string> = {
  groom: 'Ženich',
  bride: 'Nevěsta',
};

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  adult: 'Dospělý',
  child: 'Dítě',
};

export const GUEST_STATUS_LABELS: Record<GuestStatus, string> = {
  draft: 'Návrh',
  requested: 'Pozván',
  accepted: 'Přijal',
  rejected: 'Odmítl',
};

/* --- Host --- */

/** Rodina, do které host patří – jen odkaz, vlastní záznam nemá. */
export const GuestFamilySchema = v.object({
  id: v.string(),
  /** Jak se rodina jmenuje, např. „Novákovi". */
  name: v.string(),
});
export type GuestFamily = v.InferOutput<typeof GuestFamilySchema>;

export const GuestSchema = v.object({
  id: v.string(),
  weddingId: v.string(),
  firstName: v.string(),
  /** U členů rodiny nepovinné – příjmení nese název rodiny. */
  lastName: v.optional(v.string()),
  side: GuestSideSchema,
  ageGroup: AgeGroupSchema,
  status: GuestStatusSchema,
  family: v.optional(GuestFamilySchema),
  note: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
});
export type Guest = v.InferOutput<typeof GuestSchema>;

/**
 * Host z formuláře.
 *
 * Věková skupina i stav mají výchozí hodnotu, kterou doplní doména. Nesmyslnou
 * hodnotu ale schéma nespolkne – to by schovalo chybu na frontendu.
 */
export const GuestInputSchema = v.object({
  firstName: requiredText('Vyplňte jméno', NAME_MAX, `Pole může mít nejvýše ${NAME_MAX} znaků`),
  lastName: optionalText(NAME_MAX, `Pole může mít nejvýše ${NAME_MAX} znaků`),
  side: GuestSideSchema,
  ageGroup: v.optional(AgeGroupSchema),
  status: v.optional(GuestStatusSchema),
  note: optionalText(NOTE_MAX, 'Poznámka je příliš dlouhá'),
});
export type GuestInput = v.InferOutput<typeof GuestInputSchema>;

/* --- Rodina --- */

/** Člen rodiny. Bez `id` vznikne nový host, s `id` se upraví stávající. */
export const FamilyMemberInputSchema = v.object({
  id: optionalText(NAME_MAX, 'Neplatný identifikátor člena'),
  firstName: requiredText('Vyplňte jméno', NAME_MAX, `Pole může mít nejvýše ${NAME_MAX} znaků`),
  lastName: optionalText(NAME_MAX, `Pole může mít nejvýše ${NAME_MAX} znaků`),
  ageGroup: v.optional(AgeGroupSchema),
  status: v.optional(GuestStatusSchema),
  note: optionalText(NOTE_MAX, 'Poznámka je příliš dlouhá'),
});
export type FamilyMemberInput = v.InferOutput<typeof FamilyMemberInputSchema>;

/**
 * Zadání celé rodiny najednou.
 *
 * Strana se volí pro rodinu jako celek, věková skupina u každého člena zvlášť.
 * Seznam členů je při úpravě úplný – kdo v něm chybí, přestává být hostem.
 */
export const FamilyInputSchema = v.object({
  name: requiredText(
    'Vyplňte název rodiny',
    FAMILY_NAME_MAX,
    `Název může mít nejvýše ${FAMILY_NAME_MAX} znaků`,
  ),
  side: v.picklist(GUEST_SIDES, 'Vyberte, na čí straně rodina je'),
  members: v.pipe(
    v.array(FamilyMemberInputSchema, 'Přidejte alespoň jednoho člena rodiny'),
    v.minLength(1, 'Přidejte alespoň jednoho člena rodiny'),
    v.maxLength(FAMILY_MEMBERS_MAX, `Rodina může mít nejvýše ${FAMILY_MEMBERS_MAX} členů`),
  ),
});
export type FamilyInput = v.InferOutput<typeof FamilyInputSchema>;

/** Rodina složená ze svých členů – odvozuje se ze seznamu hostů. */
export const FamilySchema = v.object({
  id: v.string(),
  name: v.string(),
  side: GuestSideSchema,
  members: v.array(GuestSchema),
});
export type Family = v.InferOutput<typeof FamilySchema>;

/* --- Odvozené pohledy --- */

/** Souhrnné statistiky nad seznamem hostů. */
export const GuestStatsSchema = v.object({
  /** Všichni hosté kromě odmítnutých. */
  total: v.number(),
  accepted: v.number(),
  requested: v.number(),
  draft: v.number(),
  rejected: v.number(),
  groom: v.number(),
  bride: v.number(),
  adults: v.number(),
  children: v.number(),
});
export type GuestStats = v.InferOutput<typeof GuestStatsSchema>;

/** Statistiky hostů; odmítnutí se do „celkem" ani do stran nepočítají. */
export function calculateGuestStats(guests: readonly Guest[]): GuestStats {
  const stats: GuestStats = {
    total: 0,
    accepted: 0,
    requested: 0,
    draft: 0,
    rejected: 0,
    groom: 0,
    bride: 0,
    adults: 0,
    children: 0,
  };

  for (const guest of guests) {
    stats[guest.status] += 1;

    if (guest.status === 'rejected') continue;

    stats.total += 1;
    stats[guest.side] += 1;
    if (guest.ageGroup === 'adult') stats.adults += 1;
    else stats.children += 1;
  }

  return stats;
}

/**
 * Celé jméno hosta.
 *
 * Členové rodiny mívají vyplněné jen křestní jméno – příjmení nese název
 * rodiny, pod kterou jsou v seznamu vypsaní.
 */
export function guestFullName(guest: Pick<Guest, 'firstName' | 'lastName'>): string {
  return [guest.firstName, guest.lastName].filter(Boolean).join(' ');
}

export interface GroupedGuests {
  families: Family[];
  /** Hosté, kteří do žádné rodiny nepatří. */
  solo: Guest[];
}

/**
 * Rozdělí hosty na rodiny a jednotlivce.
 *
 * Rodina se odvozuje z hostů, vlastní záznam nemá – stranu proto bere od
 * prvního člena. Doména drží stranu u všech členů stejnou (`Guest.joinFamily`).
 */
export function groupIntoFamilies(guests: readonly Guest[], side?: GuestSide): GroupedGuests {
  const families = new Map<string, Family>();
  const solo: Guest[] = [];

  for (const guest of guests) {
    if (side && guest.side !== side) continue;

    if (!guest.family) {
      solo.push(guest);
      continue;
    }

    const existing = families.get(guest.family.id);
    if (existing) {
      existing.members.push(guest);
      continue;
    }

    families.set(guest.family.id, {
      id: guest.family.id,
      name: guest.family.name,
      side: guest.side,
      members: [guest],
    });
  }

  return { families: [...families.values()], solo };
}
