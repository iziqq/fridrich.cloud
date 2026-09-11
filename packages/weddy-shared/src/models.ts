import type {
  AgeGroup,
  GuestSide,
  GuestStatus,
  PlanningCategory,
  PlanningItemStatus,
} from './enums.js';

/** Snoubenec – ženich nebo nevěsta. */
export interface Person {
  firstName: string;
  lastName: string;
  birthYear?: number;
  email?: string;
  phone?: string;
  note?: string;
}

export interface Wedding {
  id: string;
  title: string;
  weddingDate?: string; // ISO 8601 (YYYY-MM-DD)
  groom: Person;
  bride: Person;
  createdAt: string;
  updatedAt: string;
}

/**
 * Rodina, do které host patří.
 *
 * Rodina nemá vlastní záznam – je to skupina hostů se stejným `id` a názvem.
 * Díky tomu zůstává strana na hostovi, takže filtry i statistiky fungují
 * beze změny a nemůže se stát, že by se strana rodiny rozešla se stranou
 * jejích členů.
 */
export interface GuestFamily {
  id: string;
  /** Jak se rodina jmenuje, např. „Novákovi". */
  name: string;
}

export interface Guest {
  id: string;
  weddingId: string;
  firstName: string;
  /** U členů rodiny nepovinné – příjmení nese název rodiny. */
  lastName?: string;
  side: GuestSide;
  ageGroup: AgeGroup;
  status: GuestStatus;
  family?: GuestFamily;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningItem {
  id: string;
  weddingId: string;
  category: PlanningCategory;
  name: string;
  url?: string;
  price?: number; // v CZK
  status: PlanningItemStatus;
  createdAt: string;
  updatedAt: string;
}

/* --- Vstupy --- */

export interface PersonInput {
  firstName: string;
  lastName: string;
  birthYear?: number;
  email?: string;
  phone?: string;
  note?: string;
}

export interface WeddingInput {
  title: string;
  weddingDate?: string;
  groom: PersonInput;
  bride: PersonInput;
}

export interface GuestInput {
  firstName: string;
  lastName?: string;
  side: GuestSide;
  ageGroup: AgeGroup;
  status?: GuestStatus;
  note?: string;
}

/** Člen rodiny. Bez `id` vznikne nový host, s `id` se upraví stávající. */
export interface FamilyMemberInput {
  id?: string;
  firstName: string;
  lastName?: string;
  ageGroup: AgeGroup;
  status?: GuestStatus;
  note?: string;
}

/**
 * Zadání celé rodiny najednou.
 *
 * Strana se volí pro rodinu jako celek, věková skupina u každého člena
 * zvlášť (doc/iziweddy.md, kap. 5.3).
 */
export interface FamilyInput {
  name: string;
  side: GuestSide;
  members: FamilyMemberInput[];
}

/** Rodina složená ze svých členů – odvozuje se ze seznamu hostů. */
export interface Family {
  id: string;
  name: string;
  side: GuestSide;
  members: Guest[];
}

export interface PlanningItemInput {
  category: PlanningCategory;
  name: string;
  url?: string;
  price?: number;
  status?: PlanningItemStatus;
}

/* --- Odvozené pohledy --- */

/** Souhrnné statistiky hostů (doc/iziweddy.md, kap. 5.3). */
export interface GuestStats {
  /** Všichni hosté kromě odmítnutých. */
  total: number;
  accepted: number;
  requested: number;
  draft: number;
  rejected: number;
  groom: number;
  bride: number;
  adults: number;
  children: number;
}

/** Karta svatby na dashboardu (doc/iziweddy.md, kap. 5.1). */
export interface WeddingSummary extends Wedding {
  guestCount: number;
  acceptedGuestCount: number;
  budgetTotal: number;
  /** Počet dní do svatby; `undefined`, pokud datum není vyplněné. */
  daysUntilWedding?: number;
}

export interface GuestListResponse {
  guests: Guest[];
  stats: GuestStats;
}
