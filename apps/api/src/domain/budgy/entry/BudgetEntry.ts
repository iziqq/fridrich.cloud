import type {
  BudgetEntry as BudgetEntryData,
  BudgetEntryInput,
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
    };
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
    return state;
  }

  /** Dokument pro úložiště – veřejný tvar plus vlastník, podle kterého se dělí. */
  toDocument(): BudgetEntryData & { userId: string } {
    return { ...this.toState(), userId: this.userId };
  }
}
