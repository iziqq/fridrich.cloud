<script setup lang="ts">
import type { PlanningCategory, PlanningItem, PlanningItemInput } from '@fridrich/weddy-shared';
import {
  PLANNING_CATEGORY_LABELS,
  PLANNING_ITEM_STATUS_LABELS,
  formatCurrency,
  isPlanningCategory,
} from '@fridrich/weddy-shared';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { ApiError } from '@/weddy/api';
import BottomSheet from '@/weddy/components/BottomSheet.vue';
import ChoiceField from '@/weddy/components/ChoiceField.vue';
import EmptyState from '@/weddy/components/EmptyState.vue';
import ErrorBlock from '@/weddy/components/ErrorBlock.vue';
import FabButton from '@/weddy/components/FabButton.vue';
import FormField from '@/weddy/components/FormField.vue';
import LoadingBlock from '@/weddy/components/LoadingBlock.vue';
import StatusBadge from '@/weddy/components/StatusBadge.vue';
import { usePlanningStore } from '@/weddy/stores/planning';
import { weddyPath } from '@/weddy/routes';

const route = useRoute();
const store = usePlanningStore();

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));

const category = computed<PlanningCategory | null>(() => {
  const raw = route.params['category'];
  return isPlanningCategory(raw) ? raw : null;
});

const items = computed(() => (category.value ? store.byCategory(category.value) : []));

const totals = computed(() => {
  if (!category.value) return null;
  return store.budget.byCategory[category.value];
});

onMounted(() => store.load(weddingId.value));
watch(weddingId, (id) => store.load(id));

/* --- Formulář --- */

const sheetOpen = ref(false);
const editing = ref<PlanningItem | null>(null);
const formErrors = ref<Record<string, string>>({});
const saving = ref(false);

const form = reactive({ name: '', url: '', price: '', status: 'draft' });

function openCreate(): void {
  editing.value = null;
  Object.assign(form, { name: '', url: '', price: '', status: 'draft' });
  formErrors.value = {};
  sheetOpen.value = true;
}

function openEdit(item: PlanningItem): void {
  editing.value = item;
  Object.assign(form, {
    name: item.name,
    url: item.url ?? '',
    price: item.price === undefined ? '' : String(item.price),
    status: item.status,
  });
  formErrors.value = {};
  sheetOpen.value = true;
}

async function submit(): Promise<void> {
  if (!category.value) return;

  formErrors.value = {};
  saving.value = true;

  const input = {
    category: category.value,
    name: form.name.trim(),
    url: form.url.trim() || undefined,
    price: form.price.trim() === '' ? undefined : Number(form.price),
    status: form.status,
  } as PlanningItemInput;

  try {
    if (editing.value) {
      await store.update(weddingId.value, editing.value.id, input);
    } else {
      await store.create(weddingId.value, input);
    }
    sheetOpen.value = false;
  } catch (cause) {
    formErrors.value =
      cause instanceof ApiError && cause.details.length > 0
        ? cause.fieldErrors
        : { form: cause instanceof ApiError ? cause.message : 'Uložení se nepodařilo.' };
  } finally {
    saving.value = false;
  }
}

async function removeItem(item: PlanningItem): Promise<void> {
  if (!window.confirm(`Opravdu smazat položku „${item.name}"?`)) return;

  await store.remove(weddingId.value, item.id);
  if (editing.value?.id === item.id) sheetOpen.value = false;
}

/** Přepnutí návrh ↔ schváleno přímo ze seznamu. */
async function toggleStatus(item: PlanningItem): Promise<void> {
  await store.setStatus(
    weddingId.value,
    item.id,
    item.status === 'accepted' ? 'draft' : 'accepted',
  );
}

const statusOptions = [
  { value: 'draft', label: PLANNING_ITEM_STATUS_LABELS.draft },
  { value: 'accepted', label: PLANNING_ITEM_STATUS_LABELS.accepted },
];
</script>

<template>
  <div>
    <RouterLink :to="weddyPath(`/weddings/${weddingId}/planning`)" class="back">
      ← Všechny sekce
    </RouterLink>

    <ErrorBlock v-if="!category" message="Tahle sekce neexistuje." />

    <template v-else>
      <h2>{{ PLANNING_CATEGORY_LABELS[category] }}</h2>

      <p v-if="totals && totals.total > 0" class="summary">
        Celkem {{ formatCurrency(totals.total) }}
        <span v-if="totals.accepted > 0"> · schváleno {{ formatCurrency(totals.accepted) }}</span>
        <span v-if="totals.itemsWithoutPrice > 0" class="warn">
          · {{ totals.itemsWithoutPrice }} bez ceny
        </span>
      </p>

      <LoadingBlock v-if="store.loading && store.items.length === 0" />
      <ErrorBlock v-else-if="store.error" :message="store.error" />

      <EmptyState
        v-else-if="items.length === 0"
        icon="📝"
        title="Zatím žádné varianty"
        description="Přidejte možnosti, o kterých uvažujete. Cenu můžete doplnit později."
      />

      <ul v-else class="items">
        <li v-for="item in items" :key="item.id" class="item card">
          <div class="info">
            <p class="name">{{ item.name }}</p>
            <p class="meta">
              <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer">
                Odkaz na dodavatele ↗
              </a>
              <span v-else class="no-price">Bez odkazu</span>
              ·
              <span v-if="item.price !== undefined">{{ formatCurrency(item.price) }}</span>
              <span v-else class="no-price">cena zatím není</span>
            </p>
          </div>

          <div class="controls">
            <button
              type="button"
              class="status-button"
              :title="item.status === 'accepted' ? 'Vrátit mezi návrhy' : 'Schválit'"
              @click="toggleStatus(item)"
            >
              <StatusBadge :status="item.status" />
            </button>

            <button type="button" class="icon-button" @click="openEdit(item)">
              <span class="visually-hidden">Upravit položku</span>
              <span aria-hidden="true">✏️</span>
            </button>

            <button type="button" class="icon-button" @click="removeItem(item)">
              <span class="visually-hidden">Smazat položku</span>
              <span aria-hidden="true">🗑️</span>
            </button>
          </div>
        </li>
      </ul>

      <FabButton label="Položka" @click="openCreate" />

      <BottomSheet
        v-model:open="sheetOpen"
        :title="editing ? 'Upravit položku' : 'Nová položka'"
      >
        <form class="sheet-form" novalidate @submit.prevent="submit">
          <FormField v-model="form.name" label="Název" required :error="formErrors['name']" />
          <FormField
            v-model="form.url"
            label="Odkaz na dodavatele"
            type="url"
            placeholder="https://…"
            :error="formErrors['url']"
          />
          <FormField
            v-model="form.price"
            label="Cena"
            numeric
            hint="V korunách. Nechte prázdné, dokud cenu neznáte."
            :error="formErrors['price']"
          />
          <ChoiceField v-model="form.status" label="Stav" :options="statusOptions" />

          <p v-if="formErrors['form']" class="form-error" role="alert">{{ formErrors['form'] }}</p>

          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Ukládám…' : 'Uložit' }}
          </button>
        </form>
      </BottomSheet>
    </template>
  </div>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: var(--space-1);
  color: var(--color-muted);
  font-size: 0.875rem;
  text-decoration: none;
}

.back:hover {
  color: var(--color-accent);
}

h2 {
  font-size: 1.5rem;
}

.summary {
  margin-bottom: var(--space-2);
  color: var(--color-muted);
  font-size: 0.875rem;
}

.warn {
  color: var(--amber-500);
}

.items {
  display: grid;
  gap: 0.5rem;
}

.item {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) var(--space-2);
}

.name {
  font-weight: 600;
}

.meta {
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.no-price {
  font-style: italic;
}

.controls {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.status-button,
.icon-button {
  display: grid;
  place-items: center;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
}

.status-button {
  min-width: auto;
  padding-inline: 0.25rem;
}

.status-button:hover,
.icon-button:hover {
  background: var(--sand-100);
}

.sheet-form {
  display: grid;
  gap: var(--space-2);
}

.form-error {
  color: var(--color-danger);
}
</style>
