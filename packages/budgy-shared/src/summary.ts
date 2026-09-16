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
 * Subdoména `summary` – čísla jednoho měsíce a vývoj v čase.
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
  /** Příjmy minus výdaje. Záporné číslo znamená, že měsíc nevyšel. */
  remaining: v.number(),
  /** Kolik z příjmů zbylo, 0–1; bez příjmů je nula (nedělíme nulou). */
  savedShare: v.number(),
  recurringExpenses: v.number(),
  oneOffExpenses: v.number(),
  recurringIncome: v.number(),
  oneOffIncome: v.number(),
  /** Jen kategorie, ve kterých se něco utratilo, seřazené od nejdražší. */
  byCategory: v.array(CategoryShareSchema),
});
export type MonthSummary = v.InferOutput<typeof MonthSummarySchema>;

function emptySummary(month: Month): MonthSummary {
  return {
    month,
    income: 0,
    expenses: 0,
    remaining: 0,
    savedShare: 0,
    recurringExpenses: 0,
    oneOffExpenses: 0,
    recurringIncome: 0,
    oneOffIncome: 0,
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

    summary.expenses += entry.amount;
    if (recurring) summary.recurringExpenses += entry.amount;
    else summary.oneOffExpenses += entry.amount;

    const category = entry.category ?? 'other';
    perCategory.set(category, (perCategory.get(category) ?? 0) + entry.amount);
  }

  summary.remaining = summary.income - summary.expenses;
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
