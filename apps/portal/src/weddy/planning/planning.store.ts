import type {
  PlanningBundle,
  PlanningCategory,
  PlanningItem,
  PlanningItemStatus,
} from '@fridrich/weddy-shared';
import {
  PLANNING_CATEGORIES,
  calculateBudget,
  itemStatus,
  itemTitle,
} from '@fridrich/weddy-shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { changePlanningBundleStatus } from './endpoints/changePlanningBundleStatus.endpoint';
import { changePlanningItemStatus } from './endpoints/changePlanningItemStatus.endpoint';
import {
  createPlanningBundle,
  type CreatePlanningBundleRequest,
} from './endpoints/createPlanningBundle.endpoint';
import {
  createPlanningItem,
  type CreatePlanningItemRequest,
} from './endpoints/createPlanningItem.endpoint';
import { deletePlanningBundle } from './endpoints/deletePlanningBundle.endpoint';
import { deletePlanningItem } from './endpoints/deletePlanningItem.endpoint';
import { listPlanningBundles } from './endpoints/listPlanningBundles.endpoint';
import { listPlanningItems } from './endpoints/listPlanningItems.endpoint';
import {
  updatePlanningBundle,
  type UpdatePlanningBundleRequest,
} from './endpoints/updatePlanningBundle.endpoint';
import {
  updatePlanningItem,
  type UpdatePlanningItemRequest,
} from './endpoints/updatePlanningItem.endpoint';

export interface CategoryOverview {
  category: PlanningCategory;
  itemCount: number;
  acceptedCount: number;
  total: number;
  /** Kolik položek sekce má zaplacených balíčkem – jejich cena je jinde. */
  bundleItemCount: number;
}

/** Stav subdomény `planning` – položky a balíčky všech sekcí jedné svatby. */
export const usePlanningStore = defineStore('planning', () => {
  const items = ref<PlanningItem[]>([]);
  const bundles = ref<PlanningBundle[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const loadedWeddingId = ref<string | null>(null);

  /**
   * Součty sekcí se počítají tady stejnou funkcí jako na backendu, takže se
   * čísla nemůžou rozejít a přepočet po každé změně je okamžitý.
   */
  const budget = computed(() => calculateBudget(items.value, bundles.value));

  /** Stav položky v balíčku je stav balíčku – nabídka se schvaluje jako celek. */
  function statusOf(item: PlanningItem): PlanningItemStatus {
    return itemStatus(item, bundles.value);
  }

  /** Položka založená uvnitř balíčku svůj název nemá – vystupuje pod jeho jménem. */
  function titleOf(item: PlanningItem): string {
    return itemTitle(item, bundles.value);
  }

  function bundleById(bundleId: string): PlanningBundle | undefined {
    return bundles.value.find((bundle) => bundle.id === bundleId);
  }

  function bundleOf(item: PlanningItem): PlanningBundle | undefined {
    return item.bundleId ? bundleById(item.bundleId) : undefined;
  }

  function itemsInBundle(bundleId: string): PlanningItem[] {
    return items.value.filter((item) => item.bundleId === bundleId);
  }

  const overview = computed<CategoryOverview[]>(() =>
    PLANNING_CATEGORIES.map((category) => {
      const categoryItems = items.value.filter((item) => item.category === category);
      return {
        category,
        itemCount: categoryItems.length,
        acceptedCount: categoryItems.filter((item) => statusOf(item) === 'accepted').length,
        total: budget.value.byCategory[category].total,
        bundleItemCount: budget.value.byCategory[category].bundleItems,
      };
    }),
  );

  function byCategory(category: PlanningCategory): PlanningItem[] {
    return items.value.filter((item) => item.category === category);
  }

  async function load(weddingId: string, force = false): Promise<void> {
    if (!force && loadedWeddingId.value === weddingId) return;

    loading.value = true;
    error.value = null;
    try {
      // Rozpočet i stavy položek závisí na balíčcích, takže se načítá obojí najednou.
      const [loadedItems, loadedBundles] = await Promise.all([
        listPlanningItems(weddingId),
        listPlanningBundles(weddingId),
      ]);
      items.value = loadedItems;
      bundles.value = loadedBundles;
      loadedWeddingId.value = weddingId;
    } catch (cause) {
      // Klíč hlášky z API – přeloží ho obrazovka (`translateMessage`).
      error.value = (cause as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function create(weddingId: string, request: CreatePlanningItemRequest): Promise<void> {
    const item = await createPlanningItem(weddingId, request);
    items.value = [...items.value, item];
  }

  async function update(
    weddingId: string,
    itemId: string,
    request: UpdatePlanningItemRequest,
  ): Promise<void> {
    const item = await updatePlanningItem(weddingId, itemId, request);
    items.value = items.value.map((existing) => (existing.id === itemId ? item : existing));
  }

  async function setStatus(
    weddingId: string,
    itemId: string,
    status: PlanningItemStatus,
  ): Promise<void> {
    const previous = items.value;
    items.value = items.value.map((item) => (item.id === itemId ? { ...item, status } : item));

    try {
      const updated = await changePlanningItemStatus(weddingId, itemId, { status });
      items.value = items.value.map((item) => (item.id === itemId ? updated : item));
    } catch (cause) {
      items.value = previous;
      throw cause;
    }
  }

  async function remove(weddingId: string, itemId: string): Promise<void> {
    await deletePlanningItem(weddingId, itemId);
    items.value = items.value.filter((item) => item.id !== itemId);
  }

  /* --- Balíčky --- */

  async function addBundle(
    weddingId: string,
    request: CreatePlanningBundleRequest,
  ): Promise<PlanningBundle> {
    const bundle = await createPlanningBundle(weddingId, request);
    bundles.value = [...bundles.value, bundle];
    return bundle;
  }

  async function editBundle(
    weddingId: string,
    bundleId: string,
    request: UpdatePlanningBundleRequest,
  ): Promise<void> {
    const bundle = await updatePlanningBundle(weddingId, bundleId, request);
    bundles.value = bundles.value.map((existing) => (existing.id === bundleId ? bundle : existing));
  }

  async function setBundleStatus(
    weddingId: string,
    bundleId: string,
    status: PlanningItemStatus,
  ): Promise<void> {
    const previous = bundles.value;
    bundles.value = bundles.value.map((bundle) =>
      bundle.id === bundleId ? { ...bundle, status } : bundle,
    );

    try {
      const updated = await changePlanningBundleStatus(weddingId, bundleId, { status });
      bundles.value = bundles.value.map((bundle) => (bundle.id === bundleId ? updated : bundle));
    } catch (cause) {
      bundles.value = previous;
      throw cause;
    }
  }

  /** Smazání balíčku položky nemaže – API je z něj jen vyřadí. */
  async function removeBundle(weddingId: string, bundleId: string): Promise<void> {
    await deletePlanningBundle(weddingId, bundleId);
    bundles.value = bundles.value.filter((bundle) => bundle.id !== bundleId);
    items.value = items.value.map((item) =>
      item.bundleId === bundleId ? { ...item, bundleId: undefined } : item,
    );
  }

  return {
    items,
    bundles,
    loading,
    error,
    budget,
    overview,
    byCategory,
    statusOf,
    titleOf,
    bundleById,
    bundleOf,
    itemsInBundle,
    load,
    create,
    update,
    setStatus,
    remove,
    addBundle,
    editBundle,
    setBundleStatus,
    removeBundle,
  };
});
