import type {
  Family,
  FamilyInput,
  Guest as GuestData,
  GuestInput,
  GuestStats,
  GuestStatus,
} from '@fridrich/weddy-shared';
import { calculateGuestStats, guestsKeys } from '@fridrich/weddy-shared';
import { DomainError } from '../../domain/shared/DomainError.js';
import { createFamily as composeFamily, rewriteFamily } from '../../domain/weddy/guests/Family.js';
import { Guest } from '../../domain/weddy/guests/Guest.js';
import type { GuestFilter } from '../../domain/weddy/guests/GuestRepository.js';
import { loadWeddingFor } from './wedding.js';
import type { WeddyDeps } from './deps.js';

/*
 * Use-casy subdomény `guests` – hosté a rodiny.
 */

export async function listGuests(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
  filter: GuestFilter,
): Promise<{ guests: GuestData[]; stats: GuestStats }> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);

  const all = await deps.guests.list(wedding.id);
  const states = all.map((guest) => guest.toState());

  // Statistiky se počítají ze všech hostů – filtr ovlivňuje jen seznam,
  // jinak by čísla nad tabulkou skákala podle nastaveného filtru.
  const stats = calculateGuestStats(states);

  const filtered = states.filter((guest) => {
    if (filter.side && guest.side !== filter.side) return false;
    if (filter.ageGroup && guest.ageGroup !== filter.ageGroup) return false;
    if (filter.status && guest.status !== filter.status) return false;
    return true;
  });

  return { guests: filtered, stats };
}

async function loadGuest(
  deps: WeddyDeps,
  weddingId: string,
  guestId: string,
  userId: string,
): Promise<Guest> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);

  const guest = await deps.guests.findById(wedding.id, guestId);
  if (!guest) throw DomainError.notFound(guestsKeys.guestNotFound);

  return guest;
}

export async function createGuest(
  deps: WeddyDeps,
  weddingId: string,
  input: GuestInput,
  userId: string,
): Promise<GuestData> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);

  const guest = Guest.create({
    id: deps.ids.next(),
    weddingId: wedding.id,
    guest: input,
    clock: deps.clock,
  });

  await deps.guests.save(guest);
  return guest.toState();
}

export async function updateGuest(
  deps: WeddyDeps,
  weddingId: string,
  guestId: string,
  input: GuestInput,
  userId: string,
): Promise<GuestData> {
  const guest = await loadGuest(deps, weddingId, guestId, userId);
  guest.update(input, deps.clock);

  await deps.guests.save(guest);
  return guest.toState();
}

export async function changeGuestStatus(
  deps: WeddyDeps,
  weddingId: string,
  guestId: string,
  status: GuestStatus,
  userId: string,
): Promise<GuestData> {
  const guest = await loadGuest(deps, weddingId, guestId, userId);
  guest.changeStatus(status, deps.clock);

  await deps.guests.save(guest);
  return guest.toState();
}

export async function deleteGuest(
  deps: WeddyDeps,
  weddingId: string,
  guestId: string,
  userId: string,
): Promise<void> {
  const guest = await loadGuest(deps, weddingId, guestId, userId);
  await deps.guests.delete(guest.weddingId, guest.id);
}

/* --- Rodiny --- */

async function loadFamilyMembers(
  deps: WeddyDeps,
  weddingId: string,
  familyId: string,
): Promise<Guest[]> {
  const members = (await deps.guests.list(weddingId)).filter(
    (guest) => guest.family?.id === familyId,
  );
  if (members.length === 0) throw DomainError.notFound(guestsKeys.familyNotFound);

  return members;
}

/** Založí rodinu – tedy několik hostů najednou, spojených společným `family.id`. */
export async function createFamily(
  deps: WeddyDeps,
  weddingId: string,
  input: FamilyInput,
  userId: string,
): Promise<Family> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);

  const { family, members } = composeFamily({
    familyId: deps.ids.next(),
    weddingId: wedding.id,
    family: input,
    nextId: () => deps.ids.next(),
    clock: deps.clock,
  });

  for (const member of members) {
    await deps.guests.save(member);
  }

  return { ...family, side: input.side, members: members.map((member) => member.toState()) };
}

/** Přepíše rodinu podle zadání; kdo v seznamu členů chybí, přestává být hostem. */
export async function updateFamily(
  deps: WeddyDeps,
  weddingId: string,
  familyId: string,
  input: FamilyInput,
  userId: string,
): Promise<Family> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  const current = await loadFamilyMembers(deps, wedding.id, familyId);

  const { family, members, removed } = rewriteFamily({
    familyId,
    weddingId: wedding.id,
    current,
    family: input,
    nextId: () => deps.ids.next(),
    clock: deps.clock,
  });

  for (const member of members) {
    await deps.guests.save(member);
  }
  for (const guest of removed) {
    await deps.guests.delete(wedding.id, guest.id);
  }

  return { ...family, side: input.side, members: members.map((member) => member.toState()) };
}

/** Smaže rodinu i všechny její členy. */
export async function deleteFamily(
  deps: WeddyDeps,
  weddingId: string,
  familyId: string,
  userId: string,
): Promise<void> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  const members = await loadFamilyMembers(deps, wedding.id, familyId);

  for (const member of members) {
    await deps.guests.delete(wedding.id, member.id);
  }
}
