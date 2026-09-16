import type { BudgetSummary } from '@fridrich/weddy-shared';
import { calculateBudget } from '@fridrich/weddy-shared';
import { loadWeddingFor } from './wedding.js';
import type { WeddyDeps } from './deps.js';

/**
 * Use-case subdomény `budget`.
 *
 * Rozpočet se nikde neukládá – počítá se vždy z aktuálních položek plánování.
 * Výpočet je ve sdíleném jádru, takže frontend dojde ke stejným číslům.
 */
export async function getBudget(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
): Promise<BudgetSummary> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  const [items, bundles] = await Promise.all([
    deps.items.list(wedding.id),
    deps.bundles.list(wedding.id),
  ]);

  return calculateBudget(
    items.map((item) => item.toState()),
    bundles.map((bundle) => bundle.toState()),
  );
}
