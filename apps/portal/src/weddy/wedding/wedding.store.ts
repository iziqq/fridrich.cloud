import type { Wedding, WeddingInput, WeddingSummary } from '@fridrich/weddy-shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { weddingsApi } from '@/weddy/api';

export const useWeddingsStore = defineStore('weddings', () => {
  const summaries = ref<WeddingSummary[]>([]);
  const current = ref<Wedding | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadList(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      summaries.value = await weddingsApi.list();
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
      current.value = await weddingsApi.get(weddingId);
    } catch (cause) {
      error.value = (cause as Error).message;
      current.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function create(input: WeddingInput): Promise<Wedding> {
    const wedding = await weddingsApi.create(input);
    current.value = wedding;
    return wedding;
  }

  async function update(weddingId: string, input: WeddingInput): Promise<Wedding> {
    const wedding = await weddingsApi.update(weddingId, input);
    current.value = wedding;
    return wedding;
  }

  async function remove(weddingId: string): Promise<void> {
    await weddingsApi.remove(weddingId);
    summaries.value = summaries.value.filter((summary) => summary.id !== weddingId);
    if (current.value?.id === weddingId) current.value = null;
  }

  return { summaries, current, loading, error, loadList, loadOne, create, update, remove };
});
