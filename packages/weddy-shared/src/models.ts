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

export interface Guest {
  id: string;
  weddingId: string;
  firstName: string;
  lastName: string;
  side: GuestSide;
  ageGroup: AgeGroup;
  status: GuestStatus;
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
  lastName: string;
  side: GuestSide;
  ageGroup: AgeGroup;
  status?: GuestStatus;
  note?: string;
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
