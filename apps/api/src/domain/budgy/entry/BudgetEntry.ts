import type {
  BudgetEntry as BudgetEntryData,
  BudgetEntryInput,
  BudgetEntrySource,
  EntryKind,
  EntryRecurrence,
  ExpenseCategory,
  Month,
} from '@fridrich/budgy-shared';
import { monthOf } from '@fridrich/budgy-shared';
import type { Clock } from '../../shared/Clock.js';

interface EntryDetails {
  kind: EntryKind;
  recurrence: EntryRecurrence;
  name: string;
  amount: number;
  category: ExpenseCategory | undefined;
  date: string | undefined;
  startsOn: Month | undefined;
  endsOn: Month | undefined;
  note: string | undefined;
  /** Zápis spravovaný jinou aplikací – viz `BudgetEntrySourceSchema`. */
  source: BudgetEntrySource | undefined;
}

/**
 * Položka rozpočtu – příjem nebo výdaj, pravidelný nebo jednorázový.
 *
 * Měsíc se neukládá jako záznam: pravidelná položka nese rozsah platnosti
 * (`startsOn`–`endsOn`) a jednorázová datum, takže se pohled na kterýkoli
 * měsíc dopočítá ze stejných dat (doc/wiki/domains/budgyEntries.md).
 */
export class BudgetEntry {
  private constructor(
    readonly id: string,
    readonly userId: string,
    private details: EntryDetails,
    readonly createdAt: string,
    private updatedAtValue: string,
  ) {}

  static create(input: {
    id: string;
    userId: string;
    entry: BudgetEntryInput;
    clock: Clock;
  }): BudgetEntry {
    const now = input.clock.now();
    const iso = now.toISOString();

    return new BudgetEntry(
      input.id,
      input.userId,
      BudgetEntry.detailsFrom(input.entry, monthOf(iso)),
      iso,
      iso,
    );
  }

  static fromState(state: BudgetEntryData & { userId: string }): BudgetEntry {
    return new BudgetEntry(
      state.id,
      state.userId,
      {
        kind: state.kind,
        recurrence: state.recurrence,
        name: state.name,
        amount: state.amount,
        category: state.category,
        date: state.date,
        startsOn: state.startsOn,
        endsOn: state.endsOn,
        note: state.note,
        source: state.source,
      },
      state.createdAt,
      state.updatedAt,
    );
  }

  /**
   * Pole, která k druhu položky nepatří, se zahazují.
   *
   * Jednorázová položka nemá rozsah měsíců a pravidelná datum – kdyby si je
   * nesla z dřívějška, změna opakování by položku tiše nechala platit dvakrát.
   * Pravidelná bez zadaného začátku platí od měsíce, ve kterém vznikla:
   * dozadu by přepsala historii, kterou uživatel nezadával.
   */
  private static detailsFrom(entry: BudgetEntryInput, currentMonth: Month): EntryDetails {
    const once = entry.recurrence === 'once';

    return {
      kind: entry.kind,
      recurrence: entry.recurrence,
      name: entry.name,
      amount: entry.amount,
      category: entry.kind === 'expense' ? entry.category : undefined,
      date: once ? entry.date : undefined,
      startsOn: once ? undefined : (entry.startsOn ?? currentMonth),
      endsOn: once ? undefined : entry.endsOn,
      note: entry.note,
      source: undefined,
    };
  }

  /**
   * Zápis platby z jiné aplikace – jednorázový výdaj s dnešním datem.
   *
   * Datum je den, kdy se platba označila za uhrazenou: přesnější údaj
   * aplikace nemá a do měsíce, kdy se platilo, to v praxi sedí.
   */
  static createManaged(input: {
    id: string;
    userId: string;
    name: string;
    amount: number;
    category: ExpenseCategory;
    source: BudgetEntrySource;
    clock: Clock;
  }): BudgetEntry {
    const now = input.clock.now().toISOString();

    return new BudgetEntry(
      input.id,
      input.userId,
      {
        kind: 'expense',
        recurrence: 'once',
        name: input.name,
        amount: input.amount,
        category: input.category,
        date: now.slice(0, 10),
        startsOn: undefined,
        endsOn: undefined,
        note: undefined,
        source: input.source,
      },
      now,
      now,
    );
  }

  get source(): BudgetEntrySource | undefined {
    return this.details.source;
  }

  /** Spravovaný zápis se srovná s aplikací – částka a název, datum zůstává. */
  syncManaged(input: { name: string; amount: number; path?: string }, clock: Clock): void {
    const source = this.details.source;
    if (!source) return;
    if (
      this.details.name === input.name &&
      this.details.amount === input.amount &&
      source.path === input.path
    ) {
      return;
    }

    this.details = {
      ...this.details,
      name: input.name,
      amount: input.amount,
      source: { ...source, ...(input.path ? { path: input.path } : {}) },
    };
    this.touch(clock);
  }

  /**
   * Odpojí zápis od aplikace – věc, za kterou se platilo, zmizela.
   *
   * Peníze ale odešly, takže výdaj zůstává jako běžná položka rozpočtu,
   * kterou už jde upravit i smazat ručně.
   */
  release(clock: Clock): void {
    if (!this.details.source) return;

    this.details = { ...this.details, source: undefined };
    this.touch(clock);
  }

  get updatedAt(): string {
    return this.updatedAtValue;
  }

  update(entry: BudgetEntryInput, clock: Clock): void {
    /* Začátek zůstává, pokud ho formulář neposlal – úprava částky nemá položku přesunout. */
    const startsOn = entry.startsOn ?? this.details.startsOn ?? monthOf(clock.now().toISOString());
    this.details = BudgetEntry.detailsFrom({ ...entry, startsOn }, startsOn);
    this.touch(clock);
  }

  private touch(clock: Clock): void {
    this.updatedAtValue = clock.now().toISOString();
  }

  toState(): BudgetEntryData {
    const state: BudgetEntryData = {
      id: this.id,
      kind: this.details.kind,
      recurrence: this.details.recurrence,
      name: this.details.name,
      amount: this.details.amount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };

    if (this.details.category) state.category = this.details.category;
    if (this.details.date) state.date = this.details.date;
    if (this.details.startsOn) state.startsOn = this.details.startsOn;
    if (this.details.endsOn) state.endsOn = this.details.endsOn;
    if (this.details.note) state.note = this.details.note;
    if (this.details.source) state.source = this.details.source;
    return state;
  }

  /** Dokument pro úložiště – veřejný tvar plus vlastník, podle kterého se dělí. */
  toDocument(): BudgetEntryData & { userId: string } {
    return { ...this.toState(), userId: this.userId };
  }
}
