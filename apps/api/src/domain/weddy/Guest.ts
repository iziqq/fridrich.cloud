import type { AgeGroup, Guest as GuestData, GuestSide, GuestStatus } from '@fridrich/weddy-shared';
import { isAgeGroup, isGuestSide, isGuestStatus } from '@fridrich/weddy-shared';
import type { Clock } from '../shared/Clock.js';
import { DomainError } from '../shared/DomainError.js';

const NAME_MAX = 100;
const NOTE_MAX = 2000;

interface ParsedGuest {
  firstName: string;
  lastName: string;
  side: GuestSide;
  ageGroup: AgeGroup;
  status: GuestStatus;
  note: string | undefined;
}

/**
 * Host svatby.
 *
 * Přechody mezi stavy pozvánky se schválně nevynucují – uživatel musí mít
 * možnost opravit překlep, i když tím jde „proti toku" (doc/iziweddy.md,
 * kap. 4.2).
 */
export class Guest {
  private constructor(
    readonly id: string,
    readonly weddingId: string,
    private data: ParsedGuest,
    readonly createdAt: string,
    private updatedAtValue: string,
  ) {}

  static create(input: {
    id: string;
    weddingId: string;
    raw: unknown;
    clock: Clock;
  }): Guest {
    const parsed = Guest.parse(input.raw);
    const now = input.clock.now().toISOString();
    return new Guest(input.id, input.weddingId, parsed, now, now);
  }

  static fromState(state: GuestData): Guest {
    return new Guest(
      state.id,
      state.weddingId,
      {
        firstName: state.firstName,
        lastName: state.lastName,
        side: state.side,
        ageGroup: state.ageGroup,
        status: state.status,
        note: state.note,
      },
      state.createdAt,
      state.updatedAt,
    );
  }

  private static parse(raw: unknown): ParsedGuest {
    const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
    const details: { field: string; message: string }[] = [];

    const firstName = Guest.text(input['firstName'], 'firstName', 'jméno', details);
    const lastName = Guest.text(input['lastName'], 'lastName', 'příjmení', details);

    if (!isGuestSide(input['side'])) {
      details.push({ field: 'side', message: 'Vyberte, na čí straně host je' });
    }

    // Věková skupina i stav mají výchozí hodnotu, ale nesmyslnou hodnotu
    // nespolkneme potichu – to by skrylo chybu na frontendu.
    if (input['ageGroup'] !== undefined && !isAgeGroup(input['ageGroup'])) {
      details.push({ field: 'ageGroup', message: 'Neplatná věková skupina' });
    }
    if (input['status'] !== undefined && !isGuestStatus(input['status'])) {
      details.push({ field: 'status', message: 'Neplatný stav hosta' });
    }

    let note: string | undefined;
    const rawNote = input['note'];
    if (typeof rawNote === 'string' && rawNote.trim() !== '') {
      note = rawNote.trim();
      if (note.length > NOTE_MAX) {
        details.push({ field: 'note', message: 'Poznámka je příliš dlouhá' });
      }
    }

    if (details.length > 0) throw DomainError.validation(details);

    return {
      firstName,
      lastName,
      side: isGuestSide(input['side']) ? input['side'] : 'groom',
      ageGroup: isAgeGroup(input['ageGroup']) ? input['ageGroup'] : 'adult',
      status: isGuestStatus(input['status']) ? input['status'] : 'draft',
      note,
    };
  }

  private static text(
    raw: unknown,
    field: string,
    label: string,
    details: { field: string; message: string }[],
  ): string {
    if (typeof raw !== 'string' || raw.trim() === '') {
      details.push({ field, message: `Vyplňte ${label}` });
      return '';
    }

    const trimmed = raw.trim();
    if (trimmed.length > NAME_MAX) {
      details.push({ field, message: `Pole může mít nejvýše ${NAME_MAX} znaků` });
    }

    return trimmed;
  }

  get status(): GuestStatus {
    return this.data.status;
  }

  get updatedAt(): string {
    return this.updatedAtValue;
  }

  update(raw: unknown, clock: Clock): void {
    this.data = Guest.parse(raw);
    this.touch(clock);
  }

  changeStatus(raw: unknown, clock: Clock): void {
    if (!isGuestStatus(raw)) {
      throw DomainError.field('status', 'Neplatný stav hosta');
    }
    if (this.data.status === raw) return;

    this.data.status = raw;
    this.touch(clock);
  }

  private touch(clock: Clock): void {
    this.updatedAtValue = clock.now().toISOString();
  }

  toState(): GuestData {
    const state: GuestData = {
      id: this.id,
      weddingId: this.weddingId,
      firstName: this.data.firstName,
      lastName: this.data.lastName,
      side: this.data.side,
      ageGroup: this.data.ageGroup,
      status: this.data.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };

    if (this.data.note) state.note = this.data.note;
    return state;
  }
}
