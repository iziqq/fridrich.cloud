import type {
  AgeGroup,
  Guest as GuestData,
  GuestFamily,
  GuestInput,
  GuestSide,
  GuestStatus,
} from '@fridrich/weddy-shared';
import type { Clock } from '../../shared/Clock.js';

interface GuestDetails {
  firstName: string;
  lastName: string | undefined;
  side: GuestSide;
  ageGroup: AgeGroup;
  status: GuestStatus;
  family: GuestFamily | undefined;
  note: string | undefined;
}

/**
 * Host svatby.
 *
 * Přechody mezi stavy pozvánky se schválně nevynucují – uživatel musí mít
 * možnost opravit překlep, i když tím jde „proti toku".
 *
 * Rodina nemá vlastní záznam: host do ní patří přes `family` a stranu dostává
 * od rodiny jako celku (`joinFamily`). Vstup je už rozparsovaný schématem
 * `GuestInputSchema`; výchozí hodnoty doplňuje až doména.
 */
export class Guest {
  private constructor(
    readonly id: string,
    readonly weddingId: string,
    private details: GuestDetails,
    readonly createdAt: string,
    private updatedAtValue: string,
  ) {}

  static create(input: { id: string; weddingId: string; guest: GuestInput; clock: Clock }): Guest {
    const now = input.clock.now().toISOString();
    return new Guest(input.id, input.weddingId, Guest.detailsFrom(input.guest), now, now);
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
        family: state.family,
        note: state.note,
      },
      state.createdAt,
      state.updatedAt,
    );
  }

  /** Nový host je dospělý a jen navržený, dokud uživatel neřekne jinak. */
  private static detailsFrom(guest: GuestInput): GuestDetails {
    return {
      firstName: guest.firstName,
      lastName: guest.lastName,
      side: guest.side,
      ageGroup: guest.ageGroup ?? 'adult',
      status: guest.status ?? 'draft',
      // Rodinu nastavuje use-case pro rodiny, z běžného formuláře nechodí.
      family: undefined,
      note: guest.note,
    };
  }

  get firstName(): string {
    return this.details.firstName;
  }

  get status(): GuestStatus {
    return this.details.status;
  }

  get side(): GuestSide {
    return this.details.side;
  }

  get family(): GuestFamily | undefined {
    return this.details.family;
  }

  get updatedAt(): string {
    return this.updatedAtValue;
  }

  update(guest: GuestInput, clock: Clock): void {
    const family = this.details.family;
    this.details = Guest.detailsFrom(guest);
    // Úprava hosta ho z rodiny nevyřadí – k tomu slouží úprava rodiny.
    this.details.family = family;
    this.touch(clock);
  }

  /**
   * Zařadí hosta do rodiny.
   *
   * Strana patří rodině jako celku, takže se přepíše i tady – jinak by se
   * po přesunu rodiny na druhou stranu rozešla se stranou svých členů
   * a rozbila statistiky.
   */
  joinFamily(family: GuestFamily, side: GuestSide, clock: Clock): void {
    this.details.family = family;
    this.details.side = side;
    this.touch(clock);
  }

  changeStatus(status: GuestStatus, clock: Clock): void {
    if (this.details.status === status) return;

    this.details.status = status;
    this.touch(clock);
  }

  private touch(clock: Clock): void {
    this.updatedAtValue = clock.now().toISOString();
  }

  toState(): GuestData {
    const state: GuestData = {
      id: this.id,
      weddingId: this.weddingId,
      firstName: this.details.firstName,
      side: this.details.side,
      ageGroup: this.details.ageGroup,
      status: this.details.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };

    if (this.details.lastName) state.lastName = this.details.lastName;
    if (this.details.family) state.family = this.details.family;
    if (this.details.note) state.note = this.details.note;
    return state;
  }
}
