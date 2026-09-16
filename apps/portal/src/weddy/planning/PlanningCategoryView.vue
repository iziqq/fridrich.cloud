<script setup lang="ts">
import type { PlanningCategory, PlanningItem } from '@fridrich/weddy-shared';
import { PlanningCategorySchema, formatCurrency, planningKeys } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import { ApiError } from '@/api/http';
import { currentLocale, translateMessage } from '@/i18n';
import BottomSheet from '@/weddy/components/BottomSheet.vue';
import ChoiceField from '@/weddy/components/ChoiceField.vue';
import EmptyState from '@/weddy/components/EmptyState.vue';
import ErrorBlock from '@/weddy/components/ErrorBlock.vue';
import FabButton from '@/weddy/components/FabButton.vue';
import FormField from '@/weddy/components/FormField.vue';
import LoadingBlock from '@/weddy/components/LoadingBlock.vue';
import { askConfirm } from '@/weddy/components/confirm';
import SelectField from '@/weddy/components/SelectField.vue';
import StatusBadge from '@/weddy/components/StatusBadge.vue';
import { weddyPath } from '@/weddy/routes';
import type { CreatePlanningItemRequest } from './endpoints/createPlanningItem.endpoint';
import { useWeddingStore } from '@/weddy/wedding/wedding.store';
import { usePlanningStore } from './planning.store';

const route = useRoute();
const store = usePlanningStore();
/* Viewer si sekci prohlédne, ale nic v ní nezmění. */
const weddings = useWeddingStore();
const { t } = useI18n();

/** Částka se zapisuje podle jazyka rozhraní, měna zůstává koruna. */
function money(amount: number): string {
  return formatCurrency(amount, currentLocale.value);
}

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));

const category = computed<PlanningCategory | null>(() => {
  const raw = route.params['category'];
  return v.is(PlanningCategorySchema, raw) ? raw : null;
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

/*
 * Chyby formuláře se drží jako klíče katalogu a překládají se až při
 * vykreslení – po přepnutí jazyka se tak přeloží i chyba, která už svítí.
 */
function errorText(field: string): string | undefined {
  const key = formErrors.value[field];
  return key ? translateMessage(key) : undefined;
}

const form = reactive({ name: '', url: '', price: '', status: 'draft', bundleId: '' });

/*
 * Prázdná hodnota znamená „bez balíčku". Vlastní rozbalovátko pracuje s
 * řetězci, takže se `undefined` překládá na prázdný řetězec a zpátky.
 */
const NO_BUNDLE = '';

const bundleOptions = computed(() => [
  { value: NO_BUNDLE, label: t('weddy.planning.bundles.form.noBundle') },
  ...store.bundles.map((bundle) => ({ value: bundle.id, label: bundle.name })),
]);

function openCreate(): void {
  editing.value = null;
  Object.assign(form, { name: '', url: '', price: '', status: 'draft', bundleId: NO_BUNDLE });
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
    bundleId: item.bundleId ?? NO_BUNDLE,
  });
  formErrors.value = {};
  sheetOpen.value = true;
}

async function submit(): Promise<void> {
  if (!category.value) return;

  formErrors.value = {};
  saving.value = true;

  /* Položka v balíčku nemá vlastní cenu – platí cena balíčku. */
  const inBundle = form.bundleId !== NO_BUNDLE;
  const input = {
    category: category.value,
    name: form.name.trim(),
    url: form.url.trim() || undefined,
    price: inBundle || form.price.trim() === '' ? undefined : Number(form.price),
    status: form.status,
    bundleId: inBundle ? form.bundleId : undefined,
  } as CreatePlanningItemRequest;

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
        : { form: cause instanceof ApiError ? cause.message : 'weddy.planning.category.form.saveFailed' };
  } finally {
    saving.value = false;
  }
}

async function removeItem(item: PlanningItem): Promise<void> {
  const confirmed = await askConfirm({
    title: t('weddy.planning.category.deleteItem'),
    message: t('weddy.planning.category.confirmDelete', { name: store.titleOf(item) }),
    confirmLabel: t('weddy.planning.category.deleteItem'),
    danger: true,
  });
  if (!confirmed) return;

  await store.remove(weddingId.value, item.id);
  if (editing.value?.id === item.id) sheetOpen.value = false;
}

/**
 * Přepnutí návrh ↔ schváleno přímo ze seznamu.
 *
 * Položka v balíčku vlastní stav nemá – schvaluje se celá nabídka, takže se
 * jen tiše nic nestane a tlačítko je stejně nepřístupné.
 */
async function toggleStatus(item: PlanningItem): Promise<void> {
  if (item.bundleId) return;

  await store.setStatus(
    weddingId.value,
    item.id,
    item.status === 'accepted' ? 'draft' : 'accepted',
  );
}

// Volby jsou `computed`, aby se popisky přeložily i po přepnutí jazyka.
const statusOptions = computed(() => [
  { value: 'draft', label: t(planningKeys.status.draft) },
  { value: 'accepted', label: t(planningKeys.status.accepted) },
]);
</script>

<template>
  <div>
    <RouterLink :to="weddyPath(`/weddings/${weddingId}/planning`)" class="back">
      {{ t('weddy.planning.category.back') }}
    </RouterLink>

    <ErrorBlock v-if="!category" :message="t('weddy.planning.category.notFound')" />

    <template v-else>
      <h2>{{ t(planningKeys.category[category]) }}</h2>

      <p v-if="totals && totals.bundleItems > 0" class="summary">
        {{ t('weddy.planning.category.summaryInBundles', { n: totals.bundleItems }) }}
      </p>

      <p v-if="totals && totals.total > 0" class="summary">
        {{ t('weddy.planning.category.summaryTotal', { amount: money(totals.total) }) }}
        <span v-if="totals.accepted > 0">
          · {{ t('weddy.planning.category.summaryAccepted', { amount: money(totals.accepted) }) }}
        </span>
        <span v-if="totals.itemsWithoutPrice > 0" class="warn">
          · {{ t('weddy.planning.category.summaryWithoutPrice', { n: totals.itemsWithoutPrice }) }}
        </span>
      </p>

      <LoadingBlock v-if="store.loading && store.items.length === 0" />
      <ErrorBlock v-else-if="store.error" :message="translateMessage(store.error)" />

      <EmptyState
        v-else-if="items.length === 0"
        icon="📝"
        :title="t('weddy.planning.category.emptyTitle')"
        :description="t('weddy.planning.category.emptyDescription')"
      />

      <ul v-else class="items">
        <li v-for="item in items" :key="item.id" class="item card">
          <div class="info">
            <p class="name">{{ store.titleOf(item) }}</p>
            <p class="meta">
              <!-- „Bez odkazu" u položky z balíčku nic neříká – odkaz má nabídka. -->
              <template v-if="item.url">
                <a :href="item.url" target="_blank" rel="noopener noreferrer">
                  {{ t('weddy.planning.category.vendorLink') }}
                </a>
                ·
              </template>
              <template v-else-if="!item.bundleId">
                <span class="no-price">{{ t('weddy.planning.category.noLink') }}</span>
                ·
              </template>
              <RouterLink
                v-if="store.bundleOf(item)"
                :to="weddyPath(`/weddings/${weddingId}/planning/bundles/${item.bundleId}`)"
                class="bundle-link"
              >
                <!-- Když položka vlastní název nemá, nese ho už nadpis řádku. -->
                {{
                  item.name
                    ? t('weddy.planning.category.inBundle', { name: store.bundleOf(item)?.name })
                    : t('weddy.planning.category.fromBundle')
                }}
              </RouterLink>
              <span v-else-if="item.price !== undefined">{{ money(item.price) }}</span>
              <span v-else class="no-price">{{ t('weddy.planning.category.noPrice') }}</span>
            </p>
          </div>

          <div class="controls">
            <button
              type="button"
              class="status-button"
              :disabled="!weddings.canEdit || item.bundleId !== undefined"
              :title="
                item.bundleId
                  ? t('weddy.planning.bundles.itemNote')
                  : item.status === 'accepted'
                    ? t('weddy.planning.category.backToDraft')
                    : t('weddy.planning.category.approve')
              "
              @click="toggleStatus(item)"
            >
              <StatusBadge kind="planning" :status="store.statusOf(item)" />
            </button>

            <button
              v-if="weddings.canEdit"
              type="button"
              class="icon-button"
              @click="openEdit(item)"
            >
              <span class="visually-hidden">{{ t('weddy.planning.category.editItem') }}</span>
              <span aria-hidden="true">✏️</span>
            </button>

            <button
              v-if="weddings.canEdit"
              type="button"
              class="icon-button"
              @click="removeItem(item)"
            >
              <span class="visually-hidden">{{ t('weddy.planning.category.deleteItem') }}</span>
              <span aria-hidden="true">🗑️</span>
            </button>
          </div>
        </li>
      </ul>

      <FabButton
        v-if="weddings.canEdit"
        :label="t('weddy.planning.category.addItem')"
        @click="openCreate"
      />

      <BottomSheet
        v-model:open="sheetOpen"
        :title="
          editing ? t('weddy.planning.category.editItem') : t('weddy.planning.category.newItem')
        "
      >
        <form class="sheet-form" novalidate @submit.prevent="submit">
          <FormField
            v-model="form.name"
            :label="t('weddy.planning.category.form.name')"
            :required="form.bundleId === ''"
            :error="errorText('name')"
          />
          <FormField
            v-model="form.url"
            :label="t('weddy.planning.category.form.url')"
            type="url"
            :placeholder="t('weddy.planning.category.form.urlPlaceholder')"
            :error="errorText('url')"
          />
          <SelectField
            v-if="store.bundles.length > 0"
            v-model="form.bundleId"
            :label="t('weddy.planning.bundles.form.bundle')"
            :options="bundleOptions"
          />

          <!-- V balíčku je cena i stav společný, proto se tu nezadávají. -->
          <template v-if="form.bundleId === ''">
            <FormField
              v-model="form.price"
              :label="t('weddy.planning.category.form.price')"
              numeric
              :hint="t('weddy.planning.category.form.priceHint')"
              :error="errorText('price')"
            />
            <ChoiceField
              v-model="form.status"
              :label="t('weddy.planning.category.form.status')"
              :options="statusOptions"
            />
          </template>
          <p v-else class="bundle-note">{{ t('weddy.planning.bundles.itemNote') }}</p>

          <p v-if="formErrors['form']" class="form-error" role="alert">{{ errorText('form') }}</p>

          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{
              saving
                ? t('weddy.planning.category.form.saving')
                : t('weddy.planning.category.form.submit')
            }}
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

.status-button:disabled {
  cursor: default;
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

.bundle-link {
  color: var(--color-accent);
  text-decoration: none;
}

.bundle-link:hover {
  text-decoration: underline;
}

.bundle-note {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.form-error {
  color: var(--color-danger);
}
</style>
