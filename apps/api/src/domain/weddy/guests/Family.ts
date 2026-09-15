import type { FamilyInput, FamilyMemberInput, GuestFamily, GuestSide } from '@fridrich/weddy-shared';
import type { Clock } from '../../shared/Clock.js';
import { Guest } from './Guest.js';

/*
 * Rodina – skupina hostů se stejným `family.id`, bez vlastního záznamu.
 *
 * Pravidla rodiny žijí tady, ne v use-casu: strana patří rodině jako celku,
 * seznam členů je při úpravě úplný (kdo chybí, přestává být hostem) a člen
 * s `id` je úprava stávajícího hosta, bez `id` nový host. Use-case jen načte
 * hosty, zavolá tyhle funkce a výsledek uloží.
 */

function memberAsGuest(member: FamilyMemberInput, side: GuestSide) {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    // Stranu si člen nevolí, dostane ji od rodiny.
    side,
    ageGroup: member.ageGroup,
    status: member.status,
    note: member.note,
  };
}

/** Založí rodinu – několik nových hostů spojených společným `family.id`. */
export function createFamily(input: {
  familyId: string;
  weddingId: string;
  family: FamilyInput;
  nextId: () => string;
  clock: Clock;
}): { family: GuestFamily; members: Guest[] } {
  const family: GuestFamily = { id: input.familyId, name: input.family.name };

  const members = input.family.members.map((member) => {
    const guest = Guest.create({
      id: input.nextId(),
      weddingId: input.weddingId,
      guest: memberAsGuest(member, input.family.side),
      clock: input.clock,
    });
    guest.joinFamily(family, input.family.side, input.clock);
    return guest;
  });

  return { family, members };
}

/**
 * Přepíše existující rodinu podle zadání.
 *
 * Vrací, koho uložit (upravení i noví členové) a koho smazat. Kdo v seznamu
 * chybí, z rodiny i ze seznamu hostů zmizí – jinak by nešlo člena odebrat
 * a mazat ho zvlášť přes hosty by znamenalo dvě akce na jednu úpravu.
 */
export function rewriteFamily(input: {
  familyId: string;
  weddingId: string;
  current: readonly Guest[];
  family: FamilyInput;
  nextId: () => string;
  clock: Clock;
}): { family: GuestFamily; members: Guest[]; removed: Guest[] } {
  const family: GuestFamily = { id: input.familyId, name: input.family.name };
  const remaining = new Map(input.current.map((guest) => [guest.id, guest]));
  const members: Guest[] = [];

  for (const member of input.family.members) {
    const existing = member.id ? remaining.get(member.id) : undefined;
    const details = memberAsGuest(member, input.family.side);

    if (existing) {
      existing.update(details, input.clock);
      existing.joinFamily(family, input.family.side, input.clock);
      remaining.delete(existing.id);
      members.push(existing);
      continue;
    }

    const guest = Guest.create({
      id: input.nextId(),
      weddingId: input.weddingId,
      guest: details,
      clock: input.clock,
    });
    guest.joinFamily(family, input.family.side, input.clock);
    members.push(guest);
  }

  return { family, members, removed: [...remaining.values()] };
}
