import * as v from 'valibot';
import {
  PLANNING_CATEGORIES,
  PlanningItemStatusSchema,
  bundleCategories,
  PlanningCategorySchema,
  type PlanningBundle,
  type PlanningCategory,
  type PlanningItem,
} from './planning.js';

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
  /** Položky, jejichž cenu nese balíček – v součtech nejsou, ale existují. */
  bundleItems: v.number(),
});
export type BudgetBreakdown = v.InferOutput<typeof BudgetBreakdownSchema>;

/*
 * Rozpis má klíč pro každou sekci, i prázdnou. `v.record` s výčtem klíčů by
 * z nich udělal nepovinné, takže se objekt skládá výčtem sekcí.
 */
const byCategoryEntries = Object.fromEntries(
  PLANNING_CATEGORIES.map((category) => [category, BudgetBreakdownSchema]),
) as Record<PlanningCategory, typeof BudgetBreakdownSchema>;

/**
 * Balíček v rozpočtu.
 *
 * Jeho cena je v celkových součtech, ale ne v rozpisu podle sekcí – jedna
 * cena za obřad, jídlo i hudbu se mezi ně nedá rozpočítat, aniž bychom si
 * čísla vymysleli. Proto má rozpočet vlastní seznam balíčků a u každého
 * vypsané sekce, které pokrývá.
 */
export const BudgetBundleSchema = v.object({
  id: v.string(),
  name: v.string(),
  price: v.optional(v.number()),
  status: PlanningItemStatusSchema,
  categories: v.array(PlanningCategorySchema),
  itemCount: v.number(),
});
export type BudgetBundle = v.InferOutput<typeof BudgetBundleSchema>;

export const BudgetSummarySchema = v.object({
  ...BudgetBreakdownSchema.entries,
  byCategory: v.object(byCategoryEntries),
  bundles: v.array(BudgetBundleSchema),
});
export type BudgetSummary = v.InferOutput<typeof BudgetSummarySchema>;

function emptyBreakdown(): BudgetBreakdown {
  return { total: 0, accepted: 0, draft: 0, itemsWithoutPrice: 0, bundleItems: 0 };
}

function emptyByCategory(): Record<PlanningCategory, BudgetBreakdown> {
  return Object.fromEntries(
    PLANNING_CATEGORIES.map((category) => [category, emptyBreakdown()]),
  ) as Record<PlanningCategory, BudgetBreakdown>;
}

function hasPrice(price: number | undefined): price is number {
  return typeof price === 'number' && Number.isFinite(price);
}

/**
 * Sečte ceny položek plánování a balíčků.
 *
 * Položky bez ceny se do součtů nezapočítávají, jen se počítají
 * v `itemsWithoutPrice` – upozornění, že rozpočet nemusí být úplný.
 *
 * Položka v balíčku se nepočítá vůbec: její cenu nese balíček a započítat
 * obojí by znamenalo zaplatit jednu věc dvakrát. V sekci proto přibývá jen
 * do `bundleItems`, aby bylo vidět, že sekce prázdná není.
 */
export function calculateBudget(
  items: readonly PlanningItem[],
  bundles: readonly PlanningBundle[] = [],
): BudgetSummary {
  const summary: BudgetSummary = {
    ...emptyBreakdown(),
    byCategory: emptyByCategory(),
    bundles: bundles.map((bundle) => ({
      id: bundle.id,
      name: bundle.name,
      ...(hasPrice(bundle.price) ? { price: bundle.price } : {}),
      status: bundle.status,
      categories: bundleCategories(bundle.id, items),
      itemCount: items.filter((item) => item.bundleId === bundle.id).length,
    })),
  };

  for (const item of items) {
    const category = summary.byCategory[item.category];
    if (!category) continue; // neznámá kategorie – ignorujeme

    if (item.bundleId) {
      summary.bundleItems += 1;
      category.bundleItems += 1;
      continue;
    }

    if (!hasPrice(item.price)) {
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

  for (const bundle of bundles) {
    if (!hasPrice(bundle.price)) {
      summary.itemsWithoutPrice += 1;
      continue;
    }

    summary.total += bundle.price;
    if (bundle.status === 'accepted') summary.accepted += bundle.price;
    else summary.draft += bundle.price;
  }

  return summary;
}

/* Formátování částek je společné oběma produktům – bydlí v `@fridrich/shared`. */
export { formatCurrency } from '@fridrich/shared';
