import type { Person, Wedding as WeddingData, WeddingInput } from '@fridrich/weddy-shared';
import type { Clock } from '../../shared/Clock.js';
import { DomainError } from '../../shared/DomainError.js';

export interface WeddingState extends WeddingData {
  /** ID uživatelů, kteří k plánování mají přístup. */
  ownerIds: string[];
}

/**
 * Agregát plánování svatby – kořen celé domény IziWeddy.
 *
 * Drží název, datum, oba snoubence a seznam vlastníků. Oprávnění jsou
 * vlastnost svatby, ne něco, co by měl řešit HTTP handler – kontrolu přístupu
 * proto volají všechny use-casy všech subdomén přes `assertAccessibleBy()`.
 *
 * Vstup je už rozparsovaný schématem `WeddingInputSchema` (tvar a pravidla
 * polí); agregát nese chování nad ním.
 */
export class Wedding {
  private constructor(
    readonly id: string,
    private titleValue: string,
    private weddingDateValue: string | undefined,
    private groomValue: Person,
    private brideValue: Person,
    private owners: string[],
    readonly createdAt: string,
    private updatedAtValue: string,
  ) {}

  static create(input: { id: string; wedding: WeddingInput; ownerId: string; clock: Clock }): Wedding {
    const now = input.clock.now().toISOString();

    return new Wedding(
      input.id,
      input.wedding.title,
      input.wedding.weddingDate,
      { ...input.wedding.groom },
      { ...input.wedding.bride },
      [input.ownerId],
      now,
      now,
    );
  }

  static fromState(state: WeddingState): Wedding {
    return new Wedding(
      state.id,
      state.title,
      state.weddingDate,
      { ...state.groom },
      { ...state.bride },
      [...state.ownerIds],
      state.createdAt,
      state.updatedAt,
    );
  }

  get title(): string {
    return this.titleValue;
  }

  get weddingDate(): string | undefined {
    return this.weddingDateValue;
  }

  get ownerIds(): readonly string[] {
    return this.owners;
  }

  get updatedAt(): string {
    return this.updatedAtValue;
  }

  isAccessibleBy(userId: string): boolean {
    return this.owners.includes(userId);
  }

  /** Vyhodí `forbidden`, pokud uživatel k plánování nemá přístup. */
  assertAccessibleBy(userId: string): void {
    if (!this.isAccessibleBy(userId)) {
      throw DomainError.forbidden('K tomuto plánování nemáte přístup');
    }
  }

  /** Úprava názvu, data a snoubenců – na obrazovce Snoubenci je to jeden formulář. */
  update(wedding: WeddingInput, clock: Clock): void {
    this.titleValue = wedding.title;
    this.weddingDateValue = wedding.weddingDate;
    this.groomValue = { ...wedding.groom };
    this.brideValue = { ...wedding.bride };
    this.touch(clock);
  }

  shareWith(userId: string, clock: Clock): void {
    if (this.owners.includes(userId)) return;
    this.owners.push(userId);
    this.touch(clock);
  }

  private touch(clock: Clock): void {
    this.updatedAtValue = clock.now().toISOString();
  }

  toState(): WeddingState {
    const state: WeddingState = {
      id: this.id,
      title: this.titleValue,
      groom: { ...this.groomValue },
      bride: { ...this.brideValue },
      ownerIds: [...this.owners],
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };

    if (this.weddingDateValue) state.weddingDate = this.weddingDateValue;
    return state;
  }

  /** Tvar pro frontend – bez seznamu vlastníků. */
  toPublic(): WeddingData {
    const { ownerIds: _ownerIds, ...rest } = this.toState();
    return rest;
  }
}
