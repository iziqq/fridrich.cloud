import * as v from 'valibot';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategorySchema,
  MonthSchema,
  entriesForMonth,
  shiftMonth,
  type BudgetEntry,
  type ExpenseCategory,
  type Month,
} from './entries.js';

/*
 * Subdoména `summary` – čísla jednoho měsíce, souhrn za celou dobu a vývoj.
 *
 * Nic se neukládá: měsíc se vždy spočítá z položek, stejně jako rozpočet ve
 * Weddy. Výpočet je tady, ve sdíleném jádru, aby backend i frontend došly ke
 * stejným číslům a graf nemusel nic dopočítávat po svém.
 */

/** Jedna kategorie v rozpisu výdajů – kolik a jaký podíl z výdajů měsíce. */
export const CategoryShareSchema = v.object({
  category: ExpenseCategorySchema,
  amount: v.number(),
  /** Podíl na výdajích měsíce, 0–1. Graf z něj kreslí výseč. */
  share: v.number(),
});
export type CategoryShare = v.InferOutput<typeof CategoryShareSchema>;

export const MonthSummarySchema = v.object({
  month: MonthSchema,
  income: v.number(),
  expenses: v.number(),
  /** Odložené peníze – z účtu odešly, ale neutratily se. */
  investments: v.number(),
  /** Příjmy minus výdaje minus investice. Záporné číslo znamená, že měsíc nevyšel. */
  remaining: v.number(),
  /** Kolik z příjmů zbylo, 0–1; bez příjmů je nula (nedělíme nulou). */
  savedShare: v.number(),
  recurringExpenses: v.number(),
  oneOffExpenses: v.number(),
  recurringIncome: v.number(),
  oneOffIncome: v.number(),
  recurringInvestments: v.number(),
  oneOffInvestments: v.number(),
  /** Jen kategorie, ve kterých se něco utratilo, seřazené od nejdražší. */
  byCategory: v.array(CategoryShareSchema),
});
export type MonthSummary = v.InferOutput<typeof MonthSummarySchema>;

function emptySummary(month: Month): MonthSummary {
  return {
    month,
    income: 0,
    expenses: 0,
    investments: 0,
    remaining: 0,
    savedShare: 0,
    recurringExpenses: 0,
    oneOffExpenses: 0,
    recurringIncome: 0,
    oneOffIncome: 0,
    recurringInvestments: 0,
    oneOffInvestments: 0,
    byCategory: [],
  };
}

/** Čísla jednoho měsíce – příjmy, výdaje, co zbývá a rozpis podle kategorií. */
export function summarizeMonth(entries: readonly BudgetEntry[], month: Month): MonthSummary {
  const summary = emptySummary(month);
  const perCategory = new Map<ExpenseCategory, number>();

  for (const entry of entriesForMonth(entries, month)) {
    const recurring = entry.recurrence === 'monthly';

    if (entry.kind === 'income') {
      summary.income += entry.amount;
      if (recurring) summary.recurringIncome += entry.amount;
      else summary.oneOffIncome += entry.amount;
      continue;
    }

    /*
     * Investice se z příjmů odečítá stejně jako výdaj – peníze v měsíci
     * nezbyly. Do výdajů ale nepatří: neutratily se, jen změnily podobu,
     * a v rozpisu podle kategorií by nadhodnotily, kolik měsíc stojí.
     */
    if (entry.kind === 'investment') {
      summary.investments += entry.amount;
      if (recurring) summary.recurringInvestments += entry.amount;
      else summary.oneOffInvestments += entry.amount;
      continue;
    }

    summary.expenses += entry.amount;
    if (recurring) summary.recurringExpenses += entry.amount;
    else summary.oneOffExpenses += entry.amount;

    const category = entry.category ?? 'other';
    perCategory.set(category, (perCategory.get(category) ?? 0) + entry.amount);
  }

  summary.remaining = summary.income - summary.expenses - summary.investments;
  summary.savedShare = summary.income > 0 ? summary.remaining / summary.income : 0;

  /*
   * Pořadí je od nejdražší kategorie; při shodě rozhoduje pořadí výčtu, aby
   * se stejná čísla nekreslila pokaždé jinak.
   */
  summary.byCategory = [...perCategory.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      share: summary.expenses > 0 ? amount / summary.expenses : 0,
    }))
    .sort(
      (a, b) =>
        b.amount - a.amount ||
        EXPENSE_CATEGORIES.indexOf(a.category) - EXPENSE_CATEGORIES.indexOf(b.category),
    );

  return summary;
}

export const OverallSummarySchema = v.object({
  /** Nejstarší měsíc, ve kterém něco platilo; prázdný rozpočet ho nemá. */
  firstMonth: v.optional(MonthSchema),
  months: v.number(),
  income: v.number(),
  expenses: v.number(),
  investments: v.number(),
  remaining: v.number(),
  savedShare: v.number(),
  /** Průměry na měsíc – jediné číslo, které jde porovnat mezi domácnostmi. */
  monthlyIncome: v.number(),
  monthlyExpenses: v.number(),
  monthlyInvestments: v.number(),
});
export type OverallSummary = v.InferOutput<typeof OverallSummarySchema>;

/** Nejstarší měsíc, kterého se nějaká položka týká. */
function firstMonthOf(entries: readonly BudgetEntry[]): Month | undefined {
  const months = entries
    .map((entry) => (entry.recurrence === 'once' ? entry.date?.slice(0, 7) : entry.startsOn))
    .filter((month): month is Month => Boolean(month));

  return months.length > 0 ? months.reduce((a, b) => (a < b ? a : b)) : undefined;
}

/**
 * Souhrn za celou dobu – od prvního měsíce s daty po zadaný.
 *
 * Sčítá se měsíc po měsíci, ne položka po položce: pravidelná položka platí
 * v každém měsíci svého rozsahu, takže „výplata 50 000" znamená za pět měsíců
 * 250 000. Kdyby se sčítaly položky, vyšlo by 50 000 a číslo by lhalo.
 *
 * Pro jistotu se dívá nejvýš deset let zpátky: překlep v roce u data
 * jednorázové položky by jinak protáhl výpočet přes stovky let.
 */
export function overallSummary(
  entries: readonly BudgetEntry[],
  untilMonth: Month,
): OverallSummary {
  const empty: OverallSummary = {
    months: 0,
    income: 0,
    expenses: 0,
    investments: 0,
    remaining: 0,
    savedShare: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyInvestments: 0,
  };

  const earliest = firstMonthOf(entries);
  if (!earliest) return empty;

  const firstMonth = [earliest, shiftMonth(untilMonth, -120)].reduce((a, b) => (a > b ? a : b));
  const summary: OverallSummary = { ...empty, firstMonth };

  for (let month = firstMonth; month <= untilMonth; month = shiftMonth(month, 1)) {
    const current = summarizeMonth(entries, month);

    summary.months += 1;
    summary.income += current.income;
    summary.expenses += current.expenses;
    summary.investments += current.investments;
  }

  summary.remaining = summary.income - summary.expenses - summary.investments;
  summary.savedShare = summary.income > 0 ? summary.remaining / summary.income : 0;

  if (summary.months > 0) {
    summary.monthlyIncome = Math.round(summary.income / summary.months);
    summary.monthlyExpenses = Math.round(summary.expenses / summary.months);
    summary.monthlyInvestments = Math.round(summary.investments / summary.months);
  }

  return summary;
}

/**
 * Posledních `months` měsíců včetně zadaného, od nejstaršího.
 *
 * Graf vývoje potřebuje i měsíce, ve kterých se nic nedělo – jinak by se
 * prázdné místo v řadě zavřelo a sloupce by lhaly o tom, co následuje po čem.
 */
export function monthlyTrend(
  entries: readonly BudgetEntry[],
  month: Month,
  months = 6,
): MonthSummary[] {
  return Array.from({ length: months }, (_, index) =>
    summarizeMonth(entries, shiftMonth(month, index - months + 1)),
  );
}
