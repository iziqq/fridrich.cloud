import type { Wedding, WeddingSummary } from '@fridrich/weddy-shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { createWedding, type CreateWeddingRequest } from './endpoints/createWedding.endpoint';
import { deleteWedding } from './endpoints/deleteWedding.endpoint';
import { getWedding } from './endpoints/getWedding.endpoint';
import { listWeddings } from './endpoints/listWeddings.endpoint';
import { updateWedding, type UpdateWeddingRequest } from './endpoints/updateWedding.endpoint';

/** Stav subdomény `wedding` – seznam plánování na dashboardu a právě otevřená svatba. */
export const useWeddingStore = defineStore('wedding', () => {
  const summaries = ref<WeddingSummary[]>([]);
  const current = ref<Wedding | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadList(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      summaries.value = await listWeddings();
    } catch (cause) {
      error.value = (cause as Error).message;
    } finally {
      loading.value = false;
    }
  }

  /** Načte detail; už načtenou svatbu znovu netahá, pokud si to nevynutíš. */
  async function loadOne(weddingId: string, force = false): Promise<void> {
    if (!force && current.value?.id === weddingId) return;

    loading.value = true;
    error.value = null;
    try {
      current.value = await getWedding(weddingId);
    } catch (cause) {
      error.value = (cause as Error).message;
      current.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function create(request: CreateWeddingRequest): Promise<Wedding> {
    const wedding = await createWedding(request);
    current.value = wedding;
    return wedding;
  }

  async function update(weddingId: string, request: UpdateWeddingRequest): Promise<Wedding> {
    const wedding = await updateWedding(weddingId, request);
    current.value = wedding;
    return wedding;
  }

  async function remove(weddingId: string): Promise<void> {
    await deleteWedding(weddingId);
    summaries.value = summaries.value.filter((summary) => summary.id !== weddingId);
    if (current.value?.id === weddingId) current.value = null;
  }

  return { summaries, current, loading, error, loadList, loadOne, create, update, remove };
});
