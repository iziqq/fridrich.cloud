import type { Family, Guest as GuestData, GuestSide } from '@fridrich/weddy-shared';
import { isGuestSide } from '@fridrich/weddy-shared';
import { Guest } from '../../domain/weddy/Guest.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import { loadWeddingFor } from './weddings.js';
import type { WeddyDeps } from './deps.js';

const FAMILY_NAME_MAX = 100;
const MEMBERS_MAX = 30;

interface ParsedMember {
  id: string | undefined;
  raw: Record<string, unknown>;
}

interface ParsedFamily {
  name: string;
  side: GuestSide;
  members: ParsedMember[];
}

/**
 * Rozebere zadání rodiny.
 *
 * Rodina nemá vlastní záznam – je to skupina hostů se stejným `family.id`.
 * Validace názvu a členů je proto tady, ne v `Guest`: ten o rodině ví jen
 * to, že do nějaké patří.
 */
function parse(raw: unknown): ParsedFamily {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const details: { field: string; message: string }[] = [];

  const rawName = input['name'];
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (name === '') {
    details.push({ field: 'name', message: 'Vyplňte název rodiny' });
  } else if (name.length > FAMILY_NAME_MAX) {
    details.push({ field: 'name', message: `Název může mít nejvýše ${FAMILY_NAME_MAX} znaků` });
  }

  if (!isGuestSide(input['side'])) {
    details.push({ field: 'side', message: 'Vyberte, na čí straně rodina je' });
  }

  const rawMembers = Array.isArray(input['members']) ? input['members'] : [];
  if (rawMembers.length === 0) {
    details.push({ field: 'members', message: 'Přidejte alespoň jednoho člena rodiny' });
  } else if (rawMembers.length > MEMBERS_MAX) {
    details.push({ field: 'members', message: `Rodina může mít nejvýše ${MEMBERS_MAX} členů` });
  }

  if (details.length > 0) throw DomainError.validation(details);

  const side = isGuestSide(input['side']) ? input['side'] : 'groom';

  return {
    name,
    side,
    members: rawMembers.map((member) => {
      const data = (typeof member === 'object' && member !== null ? member : {}) as Record<
        string,
        unknown
      >;
      const id = typeof data['id'] === 'string' && data['id'] !== '' ? data['id'] : undefined;

      // Stranu si člen nevolí, dostane ji od rodiny.
      return { id, raw: { ...data, side } };
    }),
  };
}

export interface FamilyResult extends Family {
  members: GuestData[];
}

function toResult(id: string, name: string, side: GuestSide, members: Guest[]): FamilyResult {
  return { id, name, side, members: members.map((member) => member.toState()) };
}

/** Založí rodinu – tedy několik hostů najednou, spojených společným `family.id`. */
export async function createFamily(
  deps: WeddyDeps,
  weddingId: string | undefined,
  raw: unknown,
  userId: string,
): Promise<FamilyResult> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  const parsed = parse(raw);

  const family = { id: deps.ids.next(), name: parsed.name };
  const created: Guest[] = [];

  for (const member of parsed.members) {
    const guest = Guest.create({
      id: deps.ids.next(),
      weddingId: wedding.id,
      raw: member.raw,
      clock: deps.clock,
    });
    guest.joinFamily(family, parsed.side, deps.clock);

    await deps.guests.save(guest);
    created.push(guest);
  }

  return toResult(family.id, family.name, parsed.side, created);
}

/**
 * Přepíše rodinu podle zadání.
 *
 * Seznam členů je úplný: kdo v něm chybí, z rodiny zmizí i ze seznamu hostů.
 * Jinak by nešlo člena odebrat – a mazat ho zvlášť přes hosty by znamenalo
 * dvě akce na jednu úpravu.
 */
export async function updateFamily(
  deps: WeddyDeps,
  weddingId: string | undefined,
  familyId: string | undefined,
  raw: unknown,
  userId: string,
): Promise<FamilyResult> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  if (!familyId) throw DomainError.notFound('Rodina');

  const existing = (await deps.guests.list(wedding.id)).filter(
    (guest) => guest.family?.id === familyId,
  );
  if (existing.length === 0) throw DomainError.notFound('Rodina');

  const parsed = parse(raw);
  const family = { id: familyId, name: parsed.name };
  const byId = new Map(existing.map((guest) => [guest.id, guest]));
  const kept: Guest[] = [];

  for (const member of parsed.members) {
    const current = member.id ? byId.get(member.id) : undefined;

    if (current) {
      current.update(member.raw, deps.clock);
      current.joinFamily(family, parsed.side, deps.clock);
      await deps.guests.save(current);
      kept.push(current);
      byId.delete(current.id);
      continue;
    }

    const guest = Guest.create({
      id: deps.ids.next(),
      weddingId: wedding.id,
      raw: member.raw,
      clock: deps.clock,
    });
    guest.joinFamily(family, parsed.side, deps.clock);
    await deps.guests.save(guest);
    kept.push(guest);
  }

  // Co ze seznamu vypadlo, přestává být hostem.
  for (const removed of byId.values()) {
    await deps.guests.delete(wedding.id, removed.id);
  }

  return toResult(familyId, parsed.name, parsed.side, kept);
}

/** Smaže rodinu i všechny její členy. */
export async function deleteFamily(
  deps: WeddyDeps,
  weddingId: string | undefined,
  familyId: string | undefined,
  userId: string,
): Promise<void> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  if (!familyId) throw DomainError.notFound('Rodina');

  const members = (await deps.guests.list(wedding.id)).filter(
    (guest) => guest.family?.id === familyId,
  );
  if (members.length === 0) throw DomainError.notFound('Rodina');

  for (const member of members) {
    await deps.guests.delete(wedding.id, member.id);
  }
}
