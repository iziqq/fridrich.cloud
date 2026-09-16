import { messageKeys, requiredText, type Catalog } from '@fridrich/shared';
import * as v from 'valibot';

/*
 * Subdoména `entries` – položky rozpočtu domácnosti.
 *
 * Jedna položka je příjem nebo výdaj a je buď **pravidelná** (každý měsíc
 * totéž – hypotéka, výplata, předplatné), nebo **jednorázová** (konkrétní
 * útrata s datem). Měsíc se nikde neukládá jako záznam: pohled na říjen je
 * prostě součet pravidelných položek, které v říjnu platily, a jednorázových
 * s datem v říjnu. Díky tomu se historie nemusí nikam kopírovat a změna
 * pravidelné položky nepřepíše minulé měsíce – ta se ukončí (`endsOn`).
 */

const NAME_MAX = 100;
const NOTE_MAX = 500;
/** Horní mez částky – chrání před překlepem, který by rozbil součty. */
const AMOUNT_MAX = 100_000_000;

const cs = {
  kind: { income: 'Příjem', expense: 'Výdaj' },
  recurrence: { monthly: 'Pravidelná', once: 'Jednorázová' },
  category: {
    housing: 'Bydlení',
    insurance: 'Pojištění',
    connectivity: 'Telefon a internet',
    subscriptions: 'Předplatné',
    transport: 'Doprava',
    food: 'Jídlo',
    household: 'Domácnost',
    entertainment: 'Zábava',
    health: 'Zdraví',
    children: 'Děti',
    other: 'Ostatní',
  },
  kindInvalid: 'Neplatný druh položky',
  recurrenceInvalid: 'Neplatné opakování',
  categoryInvalid: 'Neplatná kategorie',
  categoryRequired: 'Vyberte kategorii výdaje',
  nameRequired: 'Vyplňte název',
  nameTooLong: `Název může mít nejvýše ${NAME_MAX} znaků`,
  noteTooLong: 'Poznámka je příliš dlouhá',
  amountInvalid: 'Částka musí být kladné číslo',
  monthInvalid: 'Měsíc musí být ve tvaru RRRR-MM',
  dateInvalid: 'Zadejte platné datum',
  dateRequired: 'Vyplňte datum',
  rangeReversed: 'Konec nemůže být dřív než začátek',
  entryNotFound: 'Položka neexistuje',
};

const en: Catalog<typeof cs> = {
  kind: { income: 'Income', expense: 'Expense' },
  recurrence: { monthly: 'Recurring', once: 'One-off' },
  category: {
    housing: 'Housing',
    insurance: 'Insurance',
    connectivity: 'Phone and internet',
    subscriptions: 'Subscriptions',
    transport: 'Transport',
    food: 'Food',
    household: 'Household',
    entertainment: 'Entertainment',
    health: 'Health',
    children: 'Children',
    other: 'Other',
  },
  kindInvalid: 'Invalid entry kind',
  recurrenceInvalid: 'Invalid recurrence',
  categoryInvalid: 'Invalid category',
  categoryRequired: 'Choose a category for the expense',
  nameRequired: 'Please enter a name',
  nameTooLong: `The name can have at most ${NAME_MAX} characters`,
  noteTooLong: 'The note is too long',
  amountInvalid: 'The amount must be a positive number',
  monthInvalid: 'The month must be in the YYYY-MM format',
  dateInvalid: 'Enter a valid date',
  dateRequired: 'Please enter a date',
  rangeReversed: 'The end cannot be before the start',
  entryNotFound: 'The entry does not exist',
};

/** Hlášky a popisky subdomény `entries` – jmenný prostor `budgyShared.entries`. */
export const entriesMessages = { cs, en };
export const entriesKeys = messageKeys(cs, 'budgyShared.entries');

/* --- Výčty --- */

export const ENTRY_KINDS = ['income', 'expense'] as const;
export const ENTRY_RECURRENCES = ['monthly', 'once'] as const;

/**
 * Kategorie výdajů.
 *
 * Pevný výčet, ne uživatelské kategorie: díky tomu má každá svou barvu
 * v grafu, překlad v obou jazycích a statistiky se nemají kde rozejít.
 * Pořadí je od střechy nad hlavou k drobnostem – v takovém se rozpočet čte.
 */
export const EXPENSE_CATEGORIES = [
  'housing',
  'insurance',
  'connectivity',
  'subscriptions',
  'transport',
  'food',
  'household',
  'entertainment',
  'health',
  'children',
  'other',
] as const;

export const EntryKindSchema = v.picklist(ENTRY_KINDS, entriesKeys.kindInvalid);
export type EntryKind = v.InferOutput<typeof EntryKindSchema>;

export const EntryRecurrenceSchema = v.picklist(ENTRY_RECURRENCES, entriesKeys.recurrenceInvalid);
export type EntryRecurrence = v.InferOutput<typeof EntryRecurrenceSchema>;

export const ExpenseCategorySchema = v.picklist(EXPENSE_CATEGORIES, entriesKeys.categoryInvalid);
export type ExpenseCategory = v.InferOutput<typeof ExpenseCategorySchema>;

/* --- Měsíc --- */

/** Měsíc jako `RRRR-MM`. Řetězec se řadí i porovnává stejně jako datum. */
export const MonthSchema = v.pipe(
  v.string(entriesKeys.monthInvalid),
  v.regex(/^\d{4}-(0[1-9]|1[0-2])$/u, entriesKeys.monthInvalid),
);
export type Month = v.InferOutput<typeof MonthSchema>;

/** Datum `RRRR-MM-DD`, které opravdu existuje (31. února neprojde). */
export const EntryDateSchema = v.pipe(
  v.string(entriesKeys.dateInvalid),
  v.isoDate(entriesKeys.dateInvalid),
  v.check((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  }, entriesKeys.dateInvalid),
);

/** Měsíc, do kterého datum patří. */
export function monthOf(date: string): Month {
  return date.slice(0, 7);
}

/** Posun o `delta` měsíců – `shiftMonth('2026-01', -1)` je `'2025-12'`. */
export function shiftMonth(month: Month, delta: number): Month {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1 + delta;

  const shiftedYear = year + Math.floor(index / 12);
  const shiftedMonth = ((index % 12) + 12) % 12;
  return `${String(shiftedYear).padStart(4, '0')}-${String(shiftedMonth + 1).padStart(2, '0')}`;
}

/* --- Položka --- */

export const BudgetEntrySchema = v.object({
  id: v.string(),
  kind: EntryKindSchema,
  recurrence: EntryRecurrenceSchema,
  name: v.string(),
  /** V CZK, celé koruny. Vždy kladná – směr určuje `kind`. */
  amount: v.number(),
  /** Jen u výdajů; příjem se dělí na položky, ne na kategorie. */
  category: v.optional(ExpenseCategorySchema),
  /** Jednorázová položka: den, kdy se to stalo. */
  date: v.optional(v.string()),
  /** Pravidelná položka: od kterého měsíce platí a případně do kterého. */
  startsOn: v.optional(v.string()),
  endsOn: v.optional(v.string()),
  note: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
});
export type BudgetEntry = v.InferOutput<typeof BudgetEntrySchema>;

const AMOUNT_MESSAGE = entriesKeys.amountInvalid;

/**
 * Položka z formuláře.
 *
 * Podmíněná pravidla jsou schématem, ne doménou, aby chyba dosedla na
 * konkrétní pole a formulář ji uměl ukázat u něj:
 * výdaj potřebuje kategorii, jednorázová položka datum. `startsOn` je
 * nepovinné – když chybí, doplní doména měsíc, ve kterém se položka zakládá.
 */
export const BudgetEntryInputSchema = v.pipe(
  v.object({
    kind: EntryKindSchema,
    recurrence: EntryRecurrenceSchema,
    name: requiredText(entriesKeys.nameRequired, NAME_MAX, entriesKeys.nameTooLong),
    amount: v.pipe(
      v.number(AMOUNT_MESSAGE),
      v.finite(AMOUNT_MESSAGE),
      v.minValue(1, AMOUNT_MESSAGE),
      v.maxValue(AMOUNT_MAX, AMOUNT_MESSAGE),
      v.transform(Math.round),
    ),
    category: v.optional(ExpenseCategorySchema),
    date: v.optional(EntryDateSchema),
    startsOn: v.optional(MonthSchema),
    endsOn: v.optional(MonthSchema),
    note: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(NOTE_MAX, entriesKeys.noteTooLong))),
  }),
  v.forward(
    v.check(
      (input) => input.kind !== 'expense' || Boolean(input.category),
      entriesKeys.categoryRequired,
    ),
    ['category'],
  ),
  v.forward(
    v.check(
      (input) => input.recurrence !== 'once' || Boolean(input.date),
      entriesKeys.dateRequired,
    ),
    ['date'],
  ),
  v.forward(
    v.check(
      (input) => !input.startsOn || !input.endsOn || input.startsOn <= input.endsOn,
      entriesKeys.rangeReversed,
    ),
    ['endsOn'],
  ),
);
export type BudgetEntryInput = v.InferOutput<typeof BudgetEntryInputSchema>;

/** Platí položka v daném měsíci? Pravidelná podle rozsahu, jednorázová podle data. */
export function appliesTo(entry: BudgetEntry, month: Month): boolean {
  if (entry.recurrence === 'once') return Boolean(entry.date) && monthOf(entry.date!) === month;

  const from = entry.startsOn ?? month;
  return from <= month && (!entry.endsOn || month <= entry.endsOn);
}

/** Položky jednoho měsíce – pravidelné, které tehdy platily, a jednorázové z toho měsíce. */
export function entriesForMonth(entries: readonly BudgetEntry[], month: Month): BudgetEntry[] {
  return entries.filter((entry) => appliesTo(entry, month));
}
