import { isValidIsoDate } from '@fridrich/shared';
import type { Wedding as WeddingData } from '@fridrich/weddy-shared';
import type { Clock } from '../shared/Clock.js';
import { DomainError } from '../shared/DomainError.js';
import { Person } from './Person.js';

const TITLE_MAX = 200;

export interface WeddingState extends WeddingData {
  /** ID uživatelů, kteří k plánování mají přístup. */
  ownerIds: string[];
}

/**
 * Agregát plánování svatby.
 *
 * Drží si i seznam vlastníků – oprávnění jsou vlastnost svatby, ne něco,
 * co by měl řešit HTTP handler. Kontrola přístupu je proto metoda
 * `isAccessibleBy()`, kterou volají všechny use-casy modulu.
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

  static create(input: { id: string; raw: unknown; ownerId: string; clock: Clock }): Wedding {
    const parsed = Wedding.parse(input.raw, input.clock);
    const now = input.clock.now().toISOString();

    return new Wedding(
      input.id,
      parsed.title,
      parsed.weddingDate,
      parsed.groom,
      parsed.bride,
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
      Person.fromState(state.groom),
      Person.fromState(state.bride),
      [...state.ownerIds],
      state.createdAt,
      state.updatedAt,
    );
  }

  private static parse(
    raw: unknown,
    clock: Clock,
  ): { title: string; weddingDate: string | undefined; groom: Person; bride: Person } {
    const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

    const title = input['title'];
    if (typeof title !== 'string' || title.trim() === '') {
      throw DomainError.field('title', 'Vyplňte název svatby');
    }
    if (title.trim().length > TITLE_MAX) {
      throw DomainError.field('title', `Název může mít nejvýše ${TITLE_MAX} znaků`);
    }

    let weddingDate: string | undefined;
    const rawDate = input['weddingDate'];
    if (typeof rawDate === 'string' && rawDate.trim() !== '') {
      const trimmed = rawDate.trim();
      if (!isValidIsoDate(trimmed)) {
        throw DomainError.field('weddingDate', 'Datum musí být ve formátu RRRR-MM-DD');
      }
      weddingDate = trimmed;
    }

    const currentYear = clock.now().getUTCFullYear();

    return {
      title: title.trim(),
      weddingDate,
      groom: Person.create(input['groom'], 'groom', currentYear),
      bride: Person.create(input['bride'], 'bride', currentYear),
    };
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

  update(raw: unknown, clock: Clock): void {
    const parsed = Wedding.parse(raw, clock);

    this.titleValue = parsed.title;
    this.weddingDateValue = parsed.weddingDate;
    this.groomValue = parsed.groom;
    this.brideValue = parsed.bride;
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
      groom: this.groomValue.toState(),
      bride: this.brideValue.toState(),
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
