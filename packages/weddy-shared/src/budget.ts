import * as v from 'valibot';
import { PLANNING_CATEGORIES, type PlanningCategory, type PlanningItem } from './planning.js';

/*
 * Subdoména `budget` – rozpočet počítaný z položek plánování.
 *
 * Rozpočet se nikde neukládá, vždy se počítá z aktuálních položek. Výpočet
 * je tady, ve sdíleném jádru, aby backend (endpoint `getBudget`) i frontend
 * (okamžitý přepočet v přehledu sekcí) počítaly totéž.
 */

export const BudgetBreakdownSchema = v.object({
  total: v.number(),
  accepted: v.number(),
  draft: v.number(),
  itemsWithoutPrice: v.number(),
});
export type BudgetBreakdown = v.InferOutput<typeof BudgetBreakdownSchema>;

/*
 * Rozpis má klíč pro každou sekci, i prázdnou. `v.record` s výčtem klíčů by
 * z nich udělal nepovinné, takže se objekt skládá výčtem sekcí.
 */
const byCategoryEntries = Object.fromEntries(
  PLANNING_CATEGORIES.map((category) => [category, BudgetBreakdownSchema]),
) as Record<PlanningCategory, typeof BudgetBreakdownSchema>;

export const BudgetSummarySchema = v.object({
  ...BudgetBreakdownSchema.entries,
  byCategory: v.object(byCategoryEntries),
});
export type BudgetSummary = v.InferOutput<typeof BudgetSummarySchema>;

function emptyBreakdown(): BudgetBreakdown {
  return { total: 0, accepted: 0, draft: 0, itemsWithoutPrice: 0 };
}

function emptyByCategory(): Record<PlanningCategory, BudgetBreakdown> {
  return Object.fromEntries(
    PLANNING_CATEGORIES.map((category) => [category, emptyBreakdown()]),
  ) as Record<PlanningCategory, BudgetBreakdown>;
}

/**
 * Sečte ceny všech položek plánování.
 *
 * Položky bez ceny se do součtů nezapočítávají, jen se počítají
 * v `itemsWithoutPrice` – upozornění, že rozpočet nemusí být úplný.
 */
export function calculateBudget(items: readonly PlanningItem[]): BudgetSummary {
  const summary: BudgetSummary = { ...emptyBreakdown(), byCategory: emptyByCategory() };

  for (const item of items) {
    const category = summary.byCategory[item.category];
    if (!category) continue; // neznámá kategorie – ignorujeme

    if (typeof item.price !== 'number' || !Number.isFinite(item.price)) {
      summary.itemsWithoutPrice += 1;
      category.itemsWithoutPrice += 1;
      continue;
    }

    summary.total += item.price;
    category.total += item.price;

    if (item.status === 'accepted') {
      summary.accepted += item.price;
      category.accepted += item.price;
    } else {
      summary.draft += item.price;
      category.draft += item.price;
    }
  }

  return summary;
}

/** Formátuje částku v CZK (bez desetinných míst). */
export function formatCurrency(amount: number, locale = 'cs-CZ'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(amount);
}
