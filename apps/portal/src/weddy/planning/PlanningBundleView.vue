<script setup lang="ts">
import type { PlanningCategory, PlanningItem } from '@fridrich/weddy-shared';
import { PLANNING_CATEGORIES, formatCurrency, planningKeys } from '@fridrich/weddy-shared';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/http';
import { currentLocale, translateMessage } from '@/i18n';
import BottomSheet from '@/components/product/BottomSheet.vue';
import EmptyState from '@/components/product/EmptyState.vue';
import ErrorBlock from '@/components/product/ErrorBlock.vue';
import FabButton from '@/components/product/FabButton.vue';
import LoadingBlock from '@/components/product/LoadingBlock.vue';
import SelectField from '@/components/product/SelectField.vue';
import StatusBadge from '@/weddy/components/StatusBadge.vue';
import { askConfirm } from '@/components/product/confirm';
import { weddyPath } from '@/weddy/routes';
import { useWeddingStore } from '@/weddy/wedding/wedding.store';
import BundleSheet from './BundleSheet.vue';
import { CATEGORY_ICONS } from './categoryIcons';
import PaymentBadges from './PaymentBadges.vue';
import { usePlanningStore } from './planning.store';

/**
 * Detail balíčku – jedna nabídka za jednu cenu a soupis toho, co je v ceně.
 *
 * Položky uvnitř nemají vlastní cenu ani stav: obojí má balíček, protože se
 * přijímá jako celek (doc/wiki/domains/weddyPlanning.md).
 */
const route = useRoute();
const router = useRouter();
const store = usePlanningStore();
/* Viewer si balíček prohlédne, ale nic v něm nezmění. */
const weddings = useWeddingStore();
const { t } = useI18n();

function money(amount: number): string {
  return formatCurrency(amount, currentLocale.value);
}

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));
const bundleId = computed(() => String(route.params['bundleId'] ?? ''));

const bundle = computed(() => store.bundleById(bundleId.value));
/* Soupis jde v pořadí sekcí, ne podle toho, co kdo zadal dřív. */
const items = computed(() =>
  [...store.itemsInBundle(bundleId.value)].sort(
    (a, b) =>
      PLANNING_CATEGORIES.indexOf(a.category) - PLANNING_CATEGORIES.indexOf(b.category),
  ),
);

onMounted(() => store.load(weddingId.value));
watch(weddingId, (id) => store.load(id));

/* --- Balíček --- */

const bundleSheetOpen = ref(false);

async function toggleStatus(): Promise<void> {
  if (!bundle.value) return;
  await store.setBundleStatus(
    weddingId.value,
    bundle.value.id,
    bundle.value.status === 'accepted' ? 'draft' : 'accepted',
  );
}

async function removeBundle(): Promise<void> {
  if (!bundle.value) return;

  const confirmed = await askConfirm({
    title: t('weddy.planning.bundles.deleteBundle'),
    message: t('weddy.planning.bundles.confirmDelete', { name: bundle.value.name }),
    confirmLabel: t('weddy.planning.bundles.deleteBundle'),
    danger: true,
  });
  if (!confirmed) return;

  await store.removeBundle(weddingId.value, bundle.value.id);
  await router.replace(weddyPath(`/weddings/${weddingId.value}/planning`));
}

/* --- Položky v balíčku --- */

const itemSheetOpen = ref(false);
const editing = ref<PlanningItem | null>(null);
const formErrors = ref<Record<string, string>>({});
const saving = ref(false);

/*
 * Uvnitř balíčku se zadává jen sekce. Název ani odkaz sem nepatří – položka
 * tu říká „tohle je v ceně" a jméno i odkaz má celá nabídka.
 */
const form = reactive({ category: 'ceremonyVenue' as PlanningCategory });

function errorText(field: string): string | undefined {
  const key = formErrors.value[field];
  return key ? translateMessage(key) : undefined;
}

/**
 * Sekce, které v balíčku ještě nejsou.
 *
 * Dvakrát tatáž sekce by v soupisu neřekla nic navíc – „jídlo je v ceně" platí
 * jednou. Při úpravě zůstává v nabídce i ta právě nastavená.
 */
const categoryOptions = computed(() => {
  const used = new Set(
    items.value.filter((item) => item.id !== editing.value?.id).map((item) => item.category),
  );

  return PLANNING_CATEGORIES.filter((category) => !used.has(category)).map((category) => ({
    value: category,
    label: t(planningKeys.category[category]),
  }));
});

/** Volné sekce – když žádná nezbyde, není co přidat. */
const freeCategories = computed(() =>
  PLANNING_CATEGORIES.filter(
    (category) => !items.value.some((item) => item.category === category),
  ),
);

function openCreate(): void {
  editing.value = null;
  form.category = freeCategories.value[0] ?? 'ceremonyVenue';
  formErrors.value = {};
  itemSheetOpen.value = true;
}

function openEdit(item: PlanningItem): void {
  editing.value = item;
  form.category = item.category;
  formErrors.value = {};
  itemSheetOpen.value = true;
}

async function submitItem(): Promise<void> {
  formErrors.value = {};
  saving.value = true;

  /*
   * Cena se neposílá schválně – v balíčku ji nese balíček. Název a odkaz se
   * neposílají prázdné, ale takové, jaké jsou: položka sem mohla přijít ze
   * sekce i s nimi a přesun mezi sekcemi o ně nesmí připravit.
   */
  const input = {
    category: form.category,
    name: editing.value?.name,
    url: editing.value?.url,
    bundleId: bundleId.value,
  } as Parameters<typeof store.create>[1];

  try {
    if (editing.value) {
      await store.update(weddingId.value, editing.value.id, input);
    } else {
      await store.create(weddingId.value, input);
    }
    itemSheetOpen.value = false;
  } catch (cause) {
    formErrors.value =
      cause instanceof ApiError && cause.details.length > 0
        ? cause.fieldErrors
        : {
            form:
              cause instanceof ApiError ? cause.message : 'weddy.planning.bundles.form.saveFailed',
          };
  } finally {
    saving.value = false;
  }
}

async function removeItem(item: PlanningItem): Promise<void> {
  const confirmed = await askConfirm({
    title: t('weddy.planning.bundles.removeSection'),
    message: t('weddy.planning.bundles.confirmRemoveSection', {
      name: item.name || t(planningKeys.category[item.category]),
    }),
    confirmLabel: t('weddy.planning.bundles.removeSection'),
    danger: true,
  });
  if (!confirmed) return;

  await store.remove(weddingId.value, item.id);
  if (editing.value?.id === item.id) itemSheetOpen.value = false;
}
</script>

<template>
  <div>
    <RouterLink :to="weddyPath(`/weddings/${weddingId}/planning`)" class="back">
      {{ t('weddy.planning.bundles.back') }}
    </RouterLink>

    <LoadingBlock v-if="store.loading && store.bundles.length === 0" />
    <ErrorBlock v-else-if="store.error" :message="translateMessage(store.error)" />
    <ErrorBlock v-else-if="!bundle" :message="t('weddy.planning.bundles.notFound')" />

    <template v-else>
      <header class="head card">
        <div class="title">
          <h2>{{ bundle.name }}</h2>
          <p class="price">
            <span v-if="bundle.price !== undefined">{{ money(bundle.price) }}</span>
            <span v-else class="muted">{{ t('weddy.planning.bundles.noPrice') }}</span>
          </p>
        </div>

        <div class="controls">
          <button
            type="button"
            class="status-button"
            :disabled="!weddings.canEdit"
            :title="
              bundle.status === 'accepted'
                ? t('weddy.planning.category.backToDraft')
                : t('weddy.planning.category.approve')
            "
            @click="toggleStatus"
          >
            <StatusBadge kind="planning" :status="bundle.status" />
          </button>

          <button
            v-if="weddings.canEdit"
            type="button"
            class="icon-button"
            @click="bundleSheetOpen = true"
          >
            <span class="visually-hidden">{{ t('weddy.planning.bundles.editBundle') }}</span>
            <span aria-hidden="true">✏️</span>
          </button>

          <button v-if="weddings.canEdit" type="button" class="icon-button" @click="removeBundle">
            <span class="visually-hidden">{{ t('weddy.planning.bundles.deleteBundle') }}</span>
            <span aria-hidden="true">🗑️</span>
          </button>
        </div>

        <p v-if="bundle.url" class="link">
          <a :href="bundle.url" target="_blank" rel="noopener noreferrer">
            {{ t('weddy.planning.category.vendorLink') }}
          </a>
        </p>

        <p v-if="bundle.deposit || bundle.paid" class="payments">
          <PaymentBadges :deposit="bundle.deposit" :paid="bundle.paid" />
        </p>

        <p class="note">{{ t('weddy.planning.bundles.itemNote') }}</p>
      </header>

      <EmptyState
        v-if="items.length === 0"
        icon="📦"
        :title="t('weddy.planning.bundles.emptyTitle')"
        :description="t('weddy.planning.bundles.emptyDescription')"
      />

      <template v-else>
        <h3 class="includes">{{ t('weddy.planning.bundles.includes') }}</h3>

        <ul class="items">
          <li v-for="item in items" :key="item.id" class="item card">
            <span class="icon" aria-hidden="true">{{ CATEGORY_ICONS[item.category] }}</span>

            <div class="info">
              <p class="name">{{ t(planningKeys.category[item.category]) }}</p>
              <!-- Položka přesunutá ze sekce si nese svůj název i odkaz. -->
              <p v-if="item.name || item.url" class="meta">
                <span v-if="item.name">{{ item.name }}</span>
                <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer">
                  {{ t('weddy.planning.category.vendorLink') }}
                </a>
              </p>
            </div>

            <div class="controls">
              <button
                v-if="weddings.canEdit"
                type="button"
                class="icon-button"
                @click="openEdit(item)"
              >
                <span class="visually-hidden">{{ t('weddy.planning.bundles.changeSection') }}</span>
                <span aria-hidden="true">✏️</span>
              </button>

              <button
                v-if="weddings.canEdit"
                type="button"
                class="icon-button"
                @click="removeItem(item)"
              >
                <span class="visually-hidden">{{ t('weddy.planning.bundles.removeSection') }}</span>
                <span aria-hidden="true">🗑️</span>
              </button>
            </div>
          </li>
        </ul>
      </template>

      <FabButton
        v-if="weddings.canEdit && freeCategories.length > 0"
        :label="t('weddy.planning.bundles.addItem')"
        @click="openCreate"
      />

      <BundleSheet
        v-model:open="bundleSheetOpen"
        :wedding-id="weddingId"
        :bundle="bundle"
      />

      <BottomSheet
        v-model:open="itemSheetOpen"
        :title="
          editing
            ? t('weddy.planning.bundles.changeSection')
            : t('weddy.planning.bundles.newSection')
        "
      >
        <form class="sheet-form" novalidate @submit.prevent="submitItem">
          <SelectField
            v-model="form.category"
            :label="t('weddy.planning.bundles.form.category')"
            :options="categoryOptions"
          />

          <p class="note">{{ t('weddy.planning.bundles.sectionNote') }}</p>

          <p v-if="formErrors['form']" class="form-error" role="alert">{{ errorText('form') }}</p>

          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{
              saving
                ? t('weddy.planning.bundles.form.saving')
                : t('weddy.planning.bundles.form.submit')
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
  font-size: var(--text-sm);
  text-decoration: none;
}

.back:hover {
  color: var(--color-accent);
}

.head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-1) var(--space-2);
  align-items: start;
  margin-bottom: var(--space-3);
}

.head h2 {
  margin: 0;
  font-size: 1.25rem;
}

.price {
  margin: 0.25rem 0 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
}

.muted {
  color: var(--color-muted);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 400;
}

.link,
.payments,
.note {
  grid-column: 1 / -1;
  margin: 0;
  font-size: var(--text-xs);
}

.note {
  color: var(--color-muted);
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

.status-button:disabled {
  cursor: default;
}

.icon-button:hover {
  background: var(--sand-100);
}

.includes {
  margin: 0 0 0.5rem;
  color: var(--color-muted);
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.items {
  display: grid;
  gap: 0.5rem;
}

.item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-1) var(--space-2);
}

.icon {
  font-size: 1.5rem;
}

.name {
  margin: 0;
  font-weight: 600;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.15rem 0 0;
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.sheet-form {
  display: grid;
  gap: var(--space-2);
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--text-sm);
}
</style>
