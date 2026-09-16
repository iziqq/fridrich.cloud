import type {
  PlanningBundle as BundleData,
  PlanningBundleInput,
  PlanningCategory,
  PlanningItem as ItemData,
  PlanningItemInput,
  PlanningItemStatus,
} from '@fridrich/weddy-shared';
import { planningKeys } from '@fridrich/weddy-shared';
import { DomainError } from '../../domain/shared/DomainError.js';
import { PlanningBundle } from '../../domain/weddy/planning/PlanningBundle.js';
import { PlanningItem } from '../../domain/weddy/planning/PlanningItem.js';
import { loadWeddingFor } from './wedding.js';
import type { WeddyDeps } from './deps.js';

/*
 * Use-casy subdomény `planning` – položky v sekcích přípravy a balíčky.
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

/**
 * Balíček musí patřit téže svatbě.
 *
 * Bez téhle kontroly by se dala položka přiřadit do cizího balíčku jen
 * uhodnutým `bundleId` a cena z cizí svatby by se objevila v rozpočtu.
 */
async function assertBundleExists(
  deps: WeddyDeps,
  weddingId: string,
  bundleId: string | undefined,
): Promise<void> {
  if (!bundleId) return;

  const bundle = await deps.bundles.findById(weddingId, bundleId);
  if (!bundle) throw DomainError.notFound(planningKeys.bundleNotFound);
}

export async function createItem(
  deps: WeddyDeps,
  weddingId: string,
  input: PlanningItemInput,
  userId: string,
): Promise<ItemData> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'edit');
  await assertBundleExists(deps, wedding.id, input.bundleId);

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
  await assertBundleExists(deps, item.weddingId, input.bundleId);
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

/* --- Balíčky --- */

export async function listBundles(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
): Promise<BundleData[]> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  const bundles = await deps.bundles.list(wedding.id);
  return bundles.map((bundle) => bundle.toState());
}

async function loadBundle(
  deps: WeddyDeps,
  weddingId: string,
  bundleId: string,
  userId: string,
): Promise<PlanningBundle> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'edit');

  const bundle = await deps.bundles.findById(wedding.id, bundleId);
  if (!bundle) throw DomainError.notFound(planningKeys.bundleNotFound);

  return bundle;
}

export async function createBundle(
  deps: WeddyDeps,
  weddingId: string,
  input: PlanningBundleInput,
  userId: string,
): Promise<BundleData> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'edit');

  const bundle = PlanningBundle.create({
    id: deps.ids.next(),
    weddingId: wedding.id,
    bundle: input,
    clock: deps.clock,
  });

  await deps.bundles.save(bundle);
  return bundle.toState();
}

export async function updateBundle(
  deps: WeddyDeps,
  weddingId: string,
  bundleId: string,
  input: PlanningBundleInput,
  userId: string,
): Promise<BundleData> {
  const bundle = await loadBundle(deps, weddingId, bundleId, userId);
  bundle.update(input, deps.clock);

  await deps.bundles.save(bundle);
  return bundle.toState();
}

export async function changeBundleStatus(
  deps: WeddyDeps,
  weddingId: string,
  bundleId: string,
  status: PlanningItemStatus,
  userId: string,
): Promise<BundleData> {
  const bundle = await loadBundle(deps, weddingId, bundleId, userId);
  bundle.changeStatus(status, deps.clock);

  await deps.bundles.save(bundle);
  return bundle.toState();
}

/**
 * Smaže balíček a jeho položky z něj vyřadí.
 *
 * Položky se nemažou schválně – jsou to skutečné věci k zařízení (hudba,
 * květiny), které po zrušení nabídky nezmizí, jen zase nemají cenu. Kdyby se
 * mazaly, vzalo by smazání jedné nabídky celý rozepsaný seznam.
 */
export async function deleteBundle(
  deps: WeddyDeps,
  weddingId: string,
  bundleId: string,
  userId: string,
): Promise<void> {
  const bundle = await loadBundle(deps, weddingId, bundleId, userId);

  const items = await deps.items.list(bundle.weddingId);
  for (const item of items.filter((item) => item.bundleId === bundle.id)) {
    item.leaveBundle(deps.clock);
    await deps.items.save(item);
  }

  await deps.bundles.delete(bundle.weddingId, bundle.id);
}
