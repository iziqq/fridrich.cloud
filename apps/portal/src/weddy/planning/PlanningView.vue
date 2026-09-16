<script setup lang="ts">
import type { PlanningBundle } from '@fridrich/weddy-shared';
import { formatCurrency, PLANNING_CATEGORIES, planningKeys } from '@fridrich/weddy-shared';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import { currentLocale, translateMessage } from '@/i18n';
import ErrorBlock from '@/components/product/ErrorBlock.vue';
import LoadingBlock from '@/components/product/LoadingBlock.vue';
import StatusBadge from '@/weddy/components/StatusBadge.vue';
import PaymentBadges from './PaymentBadges.vue';
import { weddyPath } from '@/weddy/routes';
import { useWeddingStore } from '@/weddy/wedding/wedding.store';
import BundleSheet from './BundleSheet.vue';
import { CATEGORY_ICONS } from './categoryIcons';
import { usePlanningStore } from './planning.store';

const route = useRoute();
const store = usePlanningStore();
/* Viewer si přehled prohlédne, ale balíček nezaloží. */
const weddings = useWeddingStore();
const { t } = useI18n();

/** Částka se zapisuje podle jazyka rozhraní, měna zůstává koruna. */
function money(amount: number): string {
  return formatCurrency(amount, currentLocale.value);
}

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));

onMounted(() => store.load(weddingId.value));
watch(weddingId, (id) => store.load(id));

/*
 * Balíčky stojí nad sekcemi – jedna nabídka pokrývá několik sekcí najednou,
 * takže by se do žádné z nich nevešla.
 */
const bundleSheetOpen = ref(false);
const editingBundle = ref<PlanningBundle | null>(null);

function openCreateBundle(): void {
  editingBundle.value = null;
  bundleSheetOpen.value = true;
}

/** Sekce, které balíček pokrývá – čtou se z položek, samotný balíček je nedrží. */
function coveredSections(bundleId: string): string {
  const summary = store.budget.bundles.find((bundle) => bundle.id === bundleId);
  if (!summary || summary.categories.length === 0) {
    return t('weddy.planning.bundles.noItems');
  }

  return summary.categories.map((category) => t(planningKeys.category[category])).join(' · ');
}
</script>

<template>
  <div>
    <LoadingBlock v-if="store.loading && store.items.length === 0" />
    <ErrorBlock v-else-if="store.error" :message="translateMessage(store.error)" />

    <template v-else>
      <p class="lead">{{ t('weddy.planning.overview.lead', { n: PLANNING_CATEGORIES.length }) }}</p>

      <section class="bundles">
        <div class="bundles-head">
          <div>
            <h2>{{ t('weddy.planning.bundles.title') }}</h2>
            <p class="hint">{{ t('weddy.planning.bundles.lead') }}</p>
          </div>

          <button
            v-if="weddings.canEdit"
            type="button"
            class="btn btn-secondary add-bundle"
            @click="openCreateBundle"
          >
            + {{ t('weddy.planning.bundles.add') }}
          </button>
        </div>

        <ul v-if="store.bundles.length > 0" class="bundle-list">
          <li v-for="bundle in store.bundles" :key="bundle.id">
            <RouterLink
              :to="weddyPath(`/weddings/${weddingId}/planning/bundles/${bundle.id}`)"
              class="bundle card"
            >
              <span class="icon" aria-hidden="true">📦</span>

              <span class="text">
                <span class="name">{{ bundle.name }}</span>
                <span class="meta">{{ coveredSections(bundle.id) }}</span>
                <span v-if="bundle.deposit || bundle.paid" class="payments">
                  <PaymentBadges :deposit="bundle.deposit" :paid="bundle.paid" />
                </span>
              </span>

              <span class="bundle-right">
                <StatusBadge kind="planning" :status="bundle.status" />
                <span class="total">
                  {{ bundle.price === undefined ? '—' : money(bundle.price) }}
                </span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <ul class="sections">
        <li v-for="section in store.overview" :key="section.category">
          <RouterLink
            :to="weddyPath(`/weddings/${weddingId}/planning/${section.category}`)"
            class="section card"
          >
            <span class="icon" aria-hidden="true">{{ CATEGORY_ICONS[section.category] }}</span>

            <span class="text">
              <span class="name">{{ t(planningKeys.category[section.category]) }}</span>
              <span class="meta">
                <template v-if="section.itemCount === 0">
                  {{ t('weddy.planning.overview.empty') }}
                </template>
                <template v-else>
                  {{ t('weddy.planning.overview.itemCount', section.itemCount) }}
                  · {{ t('weddy.planning.overview.acceptedCount', { n: section.acceptedCount }) }}
                  <template v-if="section.bundleItemCount > 0">
                    · {{ t('weddy.planning.category.summaryInBundles', { n: section.bundleItemCount }) }}
                  </template>
                </template>
              </span>
            </span>

            <span class="total">{{ section.total > 0 ? money(section.total) : '—' }}</span>
          </RouterLink>
        </li>
      </ul>

      <BundleSheet
        v-model:open="bundleSheetOpen"
        :wedding-id="weddingId"
        :bundle="editingBundle"
      />
    </template>
  </div>
</template>

<style scoped>
.lead {
  margin-bottom: var(--space-2);
  color: var(--color-muted);
}

.bundles {
  margin-bottom: var(--space-3);
}

.bundles-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.bundles-head h2 {
  margin: 0;
  font-size: 1.125rem;
}

.hint {
  margin: 0.15rem 0 0;
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.add-bundle {
  white-space: nowrap;
}

.bundle-list {
  display: grid;
  gap: 0.5rem;
}

.payments {
  display: block;
  margin-top: 0.3rem;
}

/*
 * Na mobilu jde cena i stav pod název: tři sloupce by z názvu balíčku
 * udělaly sloupeček po jednom slově.
 */
.bundle {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2);
  align-items: center;
  min-height: var(--touch-target);
  padding: var(--space-1) var(--space-2);
  color: inherit;
  text-decoration: none;
  transition:
    border-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.bundle:hover {
  border-color: var(--rose-400);
  transform: translateY(-1px);
}

.bundle-right {
  grid-column: 2;
  display: flex;
  gap: var(--space-1);
  align-items: center;
}

@media (--tablet) {
  .bundle {
    grid-template-columns: auto 1fr auto;
  }

  .bundle-right {
    grid-column: auto;
  }
}

.sections {
  display: grid;
  gap: 0.5rem;
}

.section {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-2);
  align-items: center;
  min-height: var(--touch-target);
  padding: var(--space-1) var(--space-2);
  color: inherit;
  text-decoration: none;
  transition:
    border-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.section:hover {
  border-color: var(--rose-400);
  transform: translateY(-1px);
}

.icon {
  font-size: 1.5rem;
}

.name {
  display: block;
  font-weight: 600;
}

.meta {
  display: block;
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.total {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  white-space: nowrap;
}

@media (--tablet) {
  .sections {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
