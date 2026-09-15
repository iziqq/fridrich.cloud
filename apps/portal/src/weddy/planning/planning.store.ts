import type { PlanningCategory, PlanningItem, PlanningItemStatus } from '@fridrich/weddy-shared';
import { PLANNING_CATEGORIES, calculateBudget } from '@fridrich/weddy-shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { changePlanningItemStatus } from './endpoints/changePlanningItemStatus.endpoint';
import {
  createPlanningItem,
  type CreatePlanningItemRequest,
} from './endpoints/createPlanningItem.endpoint';
import { deletePlanningItem } from './endpoints/deletePlanningItem.endpoint';
import { listPlanningItems } from './endpoints/listPlanningItems.endpoint';
import {
  updatePlanningItem,
  type UpdatePlanningItemRequest,
} from './endpoints/updatePlanningItem.endpoint';

export interface CategoryOverview {
  category: PlanningCategory;
  itemCount: number;
  acceptedCount: number;
  total: number;
}

/** Stav subdomény `planning` – položky všech sekcí jedné svatby. */
export const usePlanningStore = defineStore('planning', () => {
  const items = ref<PlanningItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const loadedWeddingId = ref<string | null>(null);

  /**
   * Součty sekcí se počítají tady stejnou funkcí jako na backendu, takže se
   * čísla nemůžou rozejít a přepočet po každé změně je okamžitý.
   */
  const budget = computed(() => calculateBudget(items.value));

  const overview = computed<CategoryOverview[]>(() =>
    PLANNING_CATEGORIES.map((category) => {
      const categoryItems = items.value.filter((item) => item.category === category);
      return {
        category,
        itemCount: categoryItems.length,
        acceptedCount: categoryItems.filter((item) => item.status === 'accepted').length,
        total: budget.value.byCategory[category].total,
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
      items.value = await listPlanningItems(weddingId);
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

  return {
    items,
    loading,
    error,
    budget,
    overview,
    byCategory,
    load,
    create,
    update,
    setStatus,
    remove,
  };
});
