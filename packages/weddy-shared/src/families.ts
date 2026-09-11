import type { GuestSide } from './enums.js';
import type { Family, Guest } from './models.js';

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
 * Rodina se odvozuje z hostů, vlastní záznam nemá – stranu proto bere
 * od prvního člena. Use-case, který rodinu ukládá, drží stranu u všech
 * členů stejnou (viz `application/weddy/families.ts`).
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
