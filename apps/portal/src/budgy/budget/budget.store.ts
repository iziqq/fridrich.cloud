import type { BudgetEntry, Month } from '@fridrich/budgy-shared';
import {
  entriesForMonth,
  monthlyTrend,
  overallSummary,
  shiftMonth,
  summarizeMonth,
} from '@fridrich/budgy-shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  createBudgetEntry,
  type CreateBudgetEntryRequest,
} from './endpoints/createBudgetEntry.endpoint';
import { deleteBudgetEntry } from './endpoints/deleteBudgetEntry.endpoint';
import { listBudgetEntries } from './endpoints/listBudgetEntries.endpoint';
import {
  updateBudgetEntry,
  type UpdateBudgetEntryRequest,
} from './endpoints/updateBudgetEntry.endpoint';

/** Měsíc, ve kterém jsme – `RRRR-MM` podle místního času, ne UTC. */
function currentMonth(): Month {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Stav subdomény `budget` – položky rozpočtu a měsíc, na který se díváme.
 *
 * Načtou se všechny položky najednou a měsíce se z nich počítají tady stejnou
 * funkcí jako na backendu. Listování dozadu i graf vývoje jsou proto okamžité
 * a čísla se nemají kde rozejít (doc/wiki/domains/budgyBudget.md).
 */
export const useBudgetStore = defineStore('budgy-budget', () => {
  const entries = ref<BudgetEntry[]>([]);
  const month = ref<Month>(currentMonth());
  const loading = ref(false);
  const error = ref<string | null>(null);
  const loaded = ref(false);

  const summary = computed(() => summarizeMonth(entries.value, month.value));
  const trend = computed(() => monthlyTrend(entries.value, month.value));
  /* Souhrn za celou dobu počítá po měsících, ne po položkách – viz `overallSummary`. */
  const overall = computed(() => overallSummary(entries.value, currentMonth()));

  /** Položky měsíce rozdělené tak, jak je ukazuje obrazovka. */
  const sections = computed(() => {
    const visible = entriesForMonth(entries.value, month.value);
    const byAmount = (a: BudgetEntry, b: BudgetEntry): number => b.amount - a.amount;

    return {
      income: visible.filter((entry) => entry.kind === 'income').sort(byAmount),
      recurring: visible
        .filter((entry) => entry.kind === 'expense' && entry.recurrence === 'monthly')
        .sort(byAmount),
      investments: visible.filter((entry) => entry.kind === 'investment').sort(byAmount),
      // Jednorázové jdou podle data – v měsíci se čtou jako deník útrat.
      oneOff: visible
        .filter((entry) => entry.kind === 'expense' && entry.recurrence === 'once')
        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
    };
  });

  /** Dopředu jen po tenhle měsíc – rozpočet na příští rok nikdo nezadává. */
  const canGoForward = computed(() => month.value < currentMonth());

  function goToMonth(delta: number): void {
    month.value = shiftMonth(month.value, delta);
  }

  function goToCurrentMonth(): void {
    month.value = currentMonth();
  }

  async function load(force = false): Promise<void> {
    if (!force && loaded.value) return;

    loading.value = true;
    error.value = null;
    try {
      entries.value = await listBudgetEntries();
      loaded.value = true;
    } catch (cause) {
      // Klíč hlášky z API – přeloží ho obrazovka (`translateMessage`).
      error.value = (cause as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function add(request: CreateBudgetEntryRequest): Promise<void> {
    const entry = await createBudgetEntry(request);
    entries.value = [...entries.value, entry];
  }

  async function edit(entryId: string, request: UpdateBudgetEntryRequest): Promise<void> {
    const entry = await updateBudgetEntry(entryId, request);
    entries.value = entries.value.map((existing) => (existing.id === entryId ? entry : existing));
  }

  async function remove(entryId: string): Promise<void> {
    await deleteBudgetEntry(entryId);
    entries.value = entries.value.filter((entry) => entry.id !== entryId);
  }

  return {
    entries,
    month,
    loading,
    error,
    summary,
    trend,
    overall,
    sections,
    canGoForward,
    goToMonth,
    goToCurrentMonth,
    load,
    add,
    edit,
    remove,
  };
});
