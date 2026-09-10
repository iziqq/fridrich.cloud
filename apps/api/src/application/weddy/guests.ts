import type { Guest as GuestData, GuestListResponse } from '@fridrich/weddy-shared';
import { calculateGuestStats } from '@fridrich/weddy-shared';
import { Guest } from '../../domain/weddy/Guest.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import type { GuestFilter } from '../../domain/weddy/ports.js';
import { loadWeddingFor } from './weddings.js';
import type { WeddyDeps } from './deps.js';

export async function listGuests(
  deps: WeddyDeps,
  weddingId: string | undefined,
  userId: string,
  filter: GuestFilter,
): Promise<GuestListResponse> {
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
  weddingId: string | undefined,
  guestId: string | undefined,
  userId: string,
): Promise<Guest> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  if (!guestId) throw DomainError.notFound('Host');

  const guest = await deps.guests.findById(wedding.id, guestId);
  if (!guest) throw DomainError.notFound('Host');

  return guest;
}

export async function createGuest(
  deps: WeddyDeps,
  weddingId: string | undefined,
  raw: unknown,
  userId: string,
): Promise<GuestData> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);

  const guest = Guest.create({
    id: deps.ids.next(),
    weddingId: wedding.id,
    raw,
    clock: deps.clock,
  });

  await deps.guests.save(guest);
  return guest.toState();
}

export async function updateGuest(
  deps: WeddyDeps,
  weddingId: string | undefined,
  guestId: string | undefined,
  raw: unknown,
  userId: string,
): Promise<GuestData> {
  const guest = await loadGuest(deps, weddingId, guestId, userId);
  guest.update(raw, deps.clock);

  await deps.guests.save(guest);
  return guest.toState();
}

export async function changeGuestStatus(
  deps: WeddyDeps,
  weddingId: string | undefined,
  guestId: string | undefined,
  raw: unknown,
  userId: string,
): Promise<GuestData> {
  const guest = await loadGuest(deps, weddingId, guestId, userId);

  const status = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  guest.changeStatus(status['status'], deps.clock);

  await deps.guests.save(guest);
  return guest.toState();
}

export async function deleteGuest(
  deps: WeddyDeps,
  weddingId: string | undefined,
  guestId: string | undefined,
  userId: string,
): Promise<void> {
  const guest = await loadGuest(deps, weddingId, guestId, userId);
  await deps.guests.delete(guest.weddingId, guest.id);
}
