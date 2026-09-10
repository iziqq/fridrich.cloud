import type { BudgetSummary, PlanningCategory, PlanningItem as ItemData } from '@fridrich/weddy-shared';
import { calculateBudget } from '@fridrich/weddy-shared';
import { PlanningItem } from '../../domain/weddy/PlanningItem.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import { loadWeddingFor } from './weddings.js';
import type { WeddyDeps } from './deps.js';

export async function listItems(
  deps: WeddyDeps,
  weddingId: string | undefined,
  userId: string,
  category?: PlanningCategory,
): Promise<ItemData[]> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  const items = await deps.items.list(wedding.id, category);
  return items.map((item) => item.toState());
}

async function loadItem(
  deps: WeddyDeps,
  weddingId: string | undefined,
  itemId: string | undefined,
  userId: string,
): Promise<PlanningItem> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  if (!itemId) throw DomainError.notFound('Položka');

  const item = await deps.items.findById(wedding.id, itemId);
  if (!item) throw DomainError.notFound('Položka');

  return item;
}

export async function createItem(
  deps: WeddyDeps,
  weddingId: string | undefined,
  raw: unknown,
  userId: string,
): Promise<ItemData> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);

  const item = PlanningItem.create({
    id: deps.ids.next(),
    weddingId: wedding.id,
    raw,
    clock: deps.clock,
  });

  await deps.items.save(item);
  return item.toState();
}

export async function updateItem(
  deps: WeddyDeps,
  weddingId: string | undefined,
  itemId: string | undefined,
  raw: unknown,
  userId: string,
): Promise<ItemData> {
  const item = await loadItem(deps, weddingId, itemId, userId);
  item.update(raw, deps.clock);

  await deps.items.save(item);
  return item.toState();
}

export async function changeItemStatus(
  deps: WeddyDeps,
  weddingId: string | undefined,
  itemId: string | undefined,
  raw: unknown,
  userId: string,
): Promise<ItemData> {
  const item = await loadItem(deps, weddingId, itemId, userId);

  const body = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  item.changeStatus(body['status'], deps.clock);

  await deps.items.save(item);
  return item.toState();
}

export async function deleteItem(
  deps: WeddyDeps,
  weddingId: string | undefined,
  itemId: string | undefined,
  userId: string,
): Promise<void> {
  const item = await loadItem(deps, weddingId, itemId, userId);
  await deps.items.delete(item.weddingId, item.id);
}

/**
 * Rozpočet se nikde neukládá – počítá se vždy z aktuálních položek
 * (doc/iziweddy.md, kap. 5.5). Stejnou funkci volá i frontend, takže se
 * čísla nemůžou rozejít.
 */
export async function getBudget(
  deps: WeddyDeps,
  weddingId: string | undefined,
  userId: string,
): Promise<BudgetSummary> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  const items = await deps.items.list(wedding.id);

  return calculateBudget(items.map((item) => item.toState()));
}
