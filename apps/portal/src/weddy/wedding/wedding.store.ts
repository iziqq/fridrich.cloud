import {
  canEditWedding,
  canManageWeddingSettings,
  type WeddingDetail,
  type WeddingSummary,
} from '@fridrich/weddy-shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { createWedding, type CreateWeddingRequest } from './endpoints/createWedding.endpoint';
import { deleteWedding } from './endpoints/deleteWedding.endpoint';
import { getWedding } from './endpoints/getWedding.endpoint';
import { listWeddings } from './endpoints/listWeddings.endpoint';
import { updateCouple, type UpdateCoupleRequest } from './endpoints/updateCouple.endpoint';
import {
  updateWeddingSettings,
  type UpdateWeddingSettingsRequest,
} from './endpoints/updateWeddingSettings.endpoint';

/**
 * Stav subdomény `wedding` – seznam plánování na dashboardu a právě otevřená
 * svatba i s rolí přihlášeného uživatele. Podle role obrazovky skrývají
 * ovládání; skutečnou kontrolu dělá API (doc/wiki/domains/weddyWedding.md).
 */
export const useWeddingStore = defineStore('wedding', () => {
  const summaries = ref<WeddingSummary[]>([]);
  const current = ref<WeddingDetail | null>(null);
  const loading = ref(false);
  /** Klíč hlášky z API – store nepřekládá, obrazovka ho zobrazí přes `translateMessage`. */
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

  /** Smí měnit obsah (snoubenci, hosté, plánování)? */
  const canEdit = computed(() => (current.value ? canEditWedding(current.value.role) : false));

  /** Smí do nastavení – název a datum, přístupy, smazání? */
  const canManageSettings = computed(() =>
    current.value ? canManageWeddingSettings(current.value.role) : false,
  );

  async function create(request: CreateWeddingRequest): Promise<WeddingDetail> {
    const wedding = await createWedding(request);
    current.value = wedding;
    return wedding;
  }

  /** Snoubenci z obrazovky Snoubenci. */
  async function saveCouple(
    weddingId: string,
    request: UpdateCoupleRequest,
  ): Promise<WeddingDetail> {
    const wedding = await updateCouple(weddingId, request);
    current.value = wedding;
    return wedding;
  }

  /** Název a datum z Nastavení. */
  async function saveSettings(
    weddingId: string,
    request: UpdateWeddingSettingsRequest,
  ): Promise<WeddingDetail> {
    const wedding = await updateWeddingSettings(weddingId, request);
    current.value = wedding;
    return wedding;
  }

  async function remove(weddingId: string): Promise<void> {
    await deleteWedding(weddingId);
    summaries.value = summaries.value.filter((summary) => summary.id !== weddingId);
    if (current.value?.id === weddingId) current.value = null;
  }

  return {
    summaries,
    current,
    loading,
    error,
    canEdit,
    canManageSettings,
    loadList,
    loadOne,
    create,
    saveCouple,
    saveSettings,
    remove,
  };
});
