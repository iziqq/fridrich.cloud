/** Strana hosta – ke komu host patří. */
export type GuestSide = 'groom' | 'bride';

/** Věková skupina hosta. */
export type AgeGroup = 'adult' | 'child';

/** Stav pozvánky hosta. */
export type GuestStatus = 'draft' | 'requested' | 'accepted' | 'rejected';

/** Stav položky plánování. */
export type PlanningItemStatus = 'draft' | 'accepted';

/** Pevně dané sekce plánování. */
export type PlanningCategory =
  | 'ceremonyVenue'
  | 'receptionVenue'
  | 'food'
  | 'drinks'
  | 'flowers'
  | 'decorations'
  | 'suit'
  | 'dress'
  | 'rings'
  | 'bachelorParty'
  | 'otherActivities';

export const GUEST_SIDES = ['groom', 'bride'] as const satisfies readonly GuestSide[];
export const AGE_GROUPS = ['adult', 'child'] as const satisfies readonly AgeGroup[];

export const GUEST_STATUSES = [
  'draft',
  'requested',
  'accepted',
  'rejected',
] as const satisfies readonly GuestStatus[];

export const PLANNING_ITEM_STATUSES = [
  'draft',
  'accepted',
] as const satisfies readonly PlanningItemStatus[];

/**
 * Pořadí sekcí odpovídá pořadí v zadání (doc/iziweddy.md, kap. 5.4).
 *
 * Jídlo a pití stojí hned za místem veselky, ke kterému se vážou; prstýnky
 * za obleky a šaty, aby byly věci na sebe pohromadě.
 */
export const PLANNING_CATEGORIES = [
  'ceremonyVenue',
  'receptionVenue',
  'food',
  'drinks',
  'flowers',
  'decorations',
  'suit',
  'dress',
  'rings',
  'bachelorParty',
  'otherActivities',
] as const satisfies readonly PlanningCategory[];

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

export const PLANNING_ITEM_STATUS_LABELS: Record<PlanningItemStatus, string> = {
  draft: 'Návrh',
  accepted: 'Schváleno',
};

export const PLANNING_CATEGORY_LABELS: Record<PlanningCategory, string> = {
  ceremonyVenue: 'Místo obřadu',
  receptionVenue: 'Místo veselky',
  food: 'Jídlo',
  drinks: 'Pití',
  flowers: 'Květiny',
  decorations: 'Výzdoba',
  suit: 'Oblek',
  dress: 'Šaty',
  rings: 'Prstýnky',
  bachelorParty: 'Rozlučka',
  otherActivities: 'Další aktivity',
};

export function isGuestSide(value: unknown): value is GuestSide {
  return typeof value === 'string' && (GUEST_SIDES as readonly string[]).includes(value);
}

export function isAgeGroup(value: unknown): value is AgeGroup {
  return typeof value === 'string' && (AGE_GROUPS as readonly string[]).includes(value);
}

export function isGuestStatus(value: unknown): value is GuestStatus {
  return typeof value === 'string' && (GUEST_STATUSES as readonly string[]).includes(value);
}

export function isPlanningItemStatus(value: unknown): value is PlanningItemStatus {
  return (
    typeof value === 'string' && (PLANNING_ITEM_STATUSES as readonly string[]).includes(value)
  );
}

export function isPlanningCategory(value: unknown): value is PlanningCategory {
  return typeof value === 'string' && (PLANNING_CATEGORIES as readonly string[]).includes(value);
}
