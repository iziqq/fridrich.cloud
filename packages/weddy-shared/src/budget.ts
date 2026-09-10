import { PLANNING_CATEGORIES, type PlanningCategory } from './enums.js';
import type { PlanningItem } from './models.js';

export interface BudgetBreakdown {
  total: number;
  accepted: number;
  draft: number;
  itemsWithoutPrice: number;
}

export interface BudgetSummary extends BudgetBreakdown {
  byCategory: Record<PlanningCategory, BudgetBreakdown>;
}

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
 * v `itemsWithoutPrice`. Rozpočet se nikde neukládá – počítá se vždy
 * dynamicky z aktuálních položek (doc/iziweddy.md, kap. 5.5).
 *
 * Stejná funkce běží na backendu (endpoint `/budget`) i na frontendu
 * (okamžitý přepočet bez volání API), takže čísla nikdy nemůžou rozejít.
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
