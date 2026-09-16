import type {
  PlanningCategory,
  PlanningItem as ItemData,
  PlanningItemInput,
  PlanningItemStatus,
} from '@fridrich/weddy-shared';
import { planningKeys } from '@fridrich/weddy-shared';
import { DomainError } from '../../domain/shared/DomainError.js';
import { PlanningItem } from '../../domain/weddy/planning/PlanningItem.js';
import { loadWeddingFor } from './wedding.js';
import type { WeddyDeps } from './deps.js';

/*
 * Use-casy subdomény `planning` – položky v sekcích přípravy.
 */

export async function listItems(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
  category?: PlanningCategory,
): Promise<ItemData[]> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  const items = await deps.items.list(wedding.id, category);
  return items.map((item) => item.toState());
}

async function loadItem(
  deps: WeddyDeps,
  weddingId: string,
  itemId: string,
  userId: string,
): Promise<PlanningItem> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'edit');

  const item = await deps.items.findById(wedding.id, itemId);
  if (!item) throw DomainError.notFound(planningKeys.itemNotFound);

  return item;
}

export async function createItem(
  deps: WeddyDeps,
  weddingId: string,
  input: PlanningItemInput,
  userId: string,
): Promise<ItemData> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'edit');

  const item = PlanningItem.create({
    id: deps.ids.next(),
    weddingId: wedding.id,
    item: input,
    clock: deps.clock,
  });

  await deps.items.save(item);
  return item.toState();
}

export async function updateItem(
  deps: WeddyDeps,
  weddingId: string,
  itemId: string,
  input: PlanningItemInput,
  userId: string,
): Promise<ItemData> {
  const item = await loadItem(deps, weddingId, itemId, userId);
  item.update(input, deps.clock);

  await deps.items.save(item);
  return item.toState();
}

export async function changeItemStatus(
  deps: WeddyDeps,
  weddingId: string,
  itemId: string,
  status: PlanningItemStatus,
  userId: string,
): Promise<ItemData> {
  const item = await loadItem(deps, weddingId, itemId, userId);
  item.changeStatus(status, deps.clock);

  await deps.items.save(item);
  return item.toState();
}

export async function deleteItem(
  deps: WeddyDeps,
  weddingId: string,
  itemId: string,
  userId: string,
): Promise<void> {
  const item = await loadItem(deps, weddingId, itemId, userId);
  await deps.items.delete(item.weddingId, item.id);
}
