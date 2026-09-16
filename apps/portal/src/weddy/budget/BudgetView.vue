<script setup lang="ts">
import {
  PLANNING_CATEGORIES,
  calculateBudget,
  formatCurrency,
  planningKeys,
  type BudgetSummary,
  type PlanningCategory,
} from '@fridrich/weddy-shared';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import { currentLocale, translateMessage } from '@/i18n';
import ErrorBlock from '@/weddy/components/ErrorBlock.vue';
import LoadingBlock from '@/weddy/components/LoadingBlock.vue';
import StatusBadge from '@/weddy/components/StatusBadge.vue';
import { weddyPath } from '@/weddy/routes';
import { getBudget } from './endpoints/getBudget.endpoint';

const { t } = useI18n();
const route = useRoute();

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));

/*
 * Rozpočet se nikam neukládá – backend ho spočítá z aktuálních položek.
 * Stav nesdílí žádná jiná obrazovka, takže nepotřebuje store: načte se při
 * každém otevření a je tak vždy čerstvý i po úpravách v plánování.
 */
const summary = ref<BudgetSummary | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function load(id: string): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    summary.value = await getBudget(id);
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    loading.value = false;
  }
}

watch(weddingId, (id) => id && load(id), { immediate: true });

/** Než odpověď dorazí, ukazuje se prázdný rozpočet – stejný tvar, nulové součty. */
const budget = computed(() => summary.value ?? calculateBudget([]));

/** Sekce bez jediné položky by v rozpisu jen zabíraly místo. */
const usedCategories = computed(() =>
  PLANNING_CATEGORIES.filter((category) => {
    const row = budget.value.byCategory[category];
    return row.total > 0 || row.itemsWithoutPrice > 0 || row.bundleItems > 0;
  }),
);

/**
 * Popisek řádku sekce – schválená částka, položky bez ceny, položky v balíčku.
 * Skládá se tady, aby mezi částmi nezůstala oddělovací tečka viset na začátku.
 */
function categoryDetail(category: PlanningCategory): string {
  const row = budget.value.byCategory[category];
  const parts: string[] = [];

  if (row.accepted > 0) {
    parts.push(
      t('weddy.budget.categoryAccepted', {
        amount: formatCurrency(row.accepted, currentLocale.value),
      }),
    );
  }
  if (row.itemsWithoutPrice > 0) {
    parts.push(t('weddy.budget.withoutPrice', { count: row.itemsWithoutPrice }));
  }
  if (row.bundleItems > 0) parts.push(t('weddy.budget.inBundle'));

  return parts.join(' · ');
}

/** Sekce, které balíček pokrývá, vypsané za sebou – „Místo obřadu · Jídlo". */
function coveredSections(categories: readonly PlanningCategory[]): string {
  if (categories.length === 0) return t('weddy.budget.bundleNoItems');
  return categories.map((category) => t(planningKeys.category[category])).join(' · ');
}

/** Podíl pro pruh – u nulového rozpočtu nemá smysl nic kreslit. */
function share(amount: number): string {
  if (budget.value.total <= 0) return '0%';
  return `${Math.round((amount / budget.value.total) * 100)}%`;
}
</script>

<template>
  <div>
    <LoadingBlock v-if="loading && !summary" />
    <ErrorBlock v-else-if="error" :message="translateMessage(error)" />

    <template v-else>
      <section class="total card">
        <p class="label">{{ t('weddy.budget.total') }}</p>
        <p class="amount">{{ formatCurrency(budget.total, currentLocale) }}</p>

        <div class="bar" role="img" :aria-label="t('weddy.budget.acceptedShare', { share: share(budget.accepted) })">
          <span class="fill accepted" :style="{ width: share(budget.accepted) }"></span>
          <span class="fill draft" :style="{ width: share(budget.draft) }"></span>
        </div>

        <dl class="split">
          <div>
            <dt><span class="dot accepted"></span> {{ t('weddy.budget.accepted') }}</dt>
            <dd>{{ formatCurrency(budget.accepted, currentLocale) }}</dd>
          </div>
          <div>
            <dt><span class="dot draft"></span> {{ t('weddy.budget.drafts') }}</dt>
            <dd>{{ formatCurrency(budget.draft, currentLocale) }}</dd>
          </div>
        </dl>
      </section>

      <p v-if="budget.itemsWithoutPrice > 0" class="notice">
        {{ t('weddy.budget.itemsWithoutPrice', budget.itemsWithoutPrice) }}
      </p>

      <template v-if="budget.bundles.length > 0">
        <h2>{{ t('weddy.budget.bundles') }}</h2>
        <p class="hint">{{ t('weddy.budget.bundlesHint') }}</p>

        <ul class="rows">
          <li v-for="bundle in budget.bundles" :key="bundle.id" class="row card">
            <RouterLink
              :to="weddyPath(`/weddings/${weddingId}/planning/bundles/${bundle.id}`)"
              class="link"
            >
              <span class="name">
                {{ bundle.name }}
                <span class="detail covers">{{ coveredSections(bundle.categories) }}</span>
              </span>
              <span class="values">
                <span class="sum">
                  {{
                    bundle.price === undefined
                      ? '—'
                      : formatCurrency(bundle.price, currentLocale)
                  }}
                </span>
                <StatusBadge kind="planning" :status="bundle.status" />
              </span>
            </RouterLink>
          </li>
        </ul>
      </template>

      <h2>{{ t('weddy.budget.byCategory') }}</h2>

      <p v-if="usedCategories.length === 0" class="empty">
        {{ t('weddy.budget.empty') }}
        <RouterLink :to="weddyPath(`/weddings/${weddingId}/planning`)">{{ t('weddy.budget.goToPlanning') }}</RouterLink>
      </p>

      <ul v-else class="rows">
        <li v-for="category in usedCategories" :key="category" class="row card">
          <RouterLink :to="weddyPath(`/weddings/${weddingId}/planning/${category}`)" class="link">
            <span class="name">{{ t(planningKeys.category[category]) }}</span>
            <span class="values">
              <span class="sum">
                {{
                  budget.byCategory[category].total > 0
                    ? formatCurrency(budget.byCategory[category].total, currentLocale)
                    : '—'
                }}
              </span>
              <span class="detail">{{ categoryDetail(category) }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.hint {
  margin: -0.25rem 0 var(--space-1);
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.covers {
  display: block;
  margin-top: 0.15rem;
}

.total {
  text-align: center;
}

.total .label {
  margin-inline: auto;
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.amount {
  margin-inline: auto;
  font-family: var(--font-display);
  font-size: clamp(2.25rem, 1.5rem + 3vw, 3rem);
  font-weight: 600;
  line-height: 1.1;
}

.bar {
  display: flex;
  overflow: hidden;
  height: 0.5rem;
  margin-top: var(--space-2);
  border-radius: 999px;
  background: var(--sand-100);
}

.fill.accepted {
  background: var(--sage-500);
}

.fill.draft {
  background: var(--rose-400);
}

.split {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.split dt {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
}

.dot.accepted {
  background: var(--sage-500);
}

.dot.draft {
  background: var(--rose-400);
}

.split dd {
  margin: 0;
  font-weight: 600;
}

.notice {
  margin-top: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: #fdf6e3;
  color: #8a6416;
  font-size: 0.875rem;
}

h2 {
  margin-top: var(--space-3);
  margin-bottom: var(--space-1);
  font-size: 1.25rem;
}

.empty {
  color: var(--color-muted);
}

.rows {
  display: grid;
  gap: 0.5rem;
}

.row {
  padding: 0;
}

.link {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
  min-height: var(--touch-target);
  padding: var(--space-1) var(--space-2);
  color: inherit;
  text-decoration: none;
}

.link:hover {
  color: var(--color-accent);
}

.name {
  font-weight: 600;
}

.values {
  text-align: right;
}

.sum {
  display: block;
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
}

.detail {
  display: block;
  color: var(--color-muted);
  font-size: 0.75rem;
}
</style>
