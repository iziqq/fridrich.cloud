<script setup lang="ts">
import { formatCurrency, type EntryKind } from '@fridrich/budgy-shared';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';
import EmptyState from '@/components/product/EmptyState.vue';
import ErrorBlock from '@/components/product/ErrorBlock.vue';
import LoadingBlock from '@/components/product/LoadingBlock.vue';
import { currentLocale, translateMessage } from '@/i18n';
import { budgyPath } from '../routes';
import EntrySheet from './EntrySheet.vue';
import TrendChart from './TrendChart.vue';
import { useBudgetStore } from './budget.store';

/**
 * Přehled rozpočtu.
 *
 * Úvodní obrazovka produktu: velká čísla za celou dobu, widget s aktuálním
 * měsícem, který prokliká na jeho detail, a vývoj po měsících. Podrobnosti
 * jednoho měsíce jsou na `/izi-budgy/mesic` (doc/wiki/domains/budgyBudget.md).
 */
const store = useBudgetStore();
const router = useRouter();
const { t } = useI18n();

onMounted(() => store.load());

function money(amount: number): string {
  return formatCurrency(amount, currentLocale.value);
}

/*
 * Dlouhá částka dostane menší stupeň písma.
 *
 * Součty za celou dobu snadno přerostou milion a „1 375 000 Kč" se na
 * telefonu do poloviční karty nevejde. Zalomit ji nejde – mezery uvnitř
 * jsou nezlomitelné – a zmenšovat všechny částky kvůli těm dlouhým by
 * vzalo čitelnost i těm krátkým. Rozhoduje délka zápisu, ne velikost čísla:
 * záleží na tom, kolik znaků se musí vejít.
 */
function amountSize(amount: number): string {
  return money(amount).length > 10 ? 'long' : '';
}

const monthLabel = computed(() =>
  new Intl.DateTimeFormat(currentLocale.value, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${store.month}-01T00:00:00.000Z`)),
);

/**
 * Od kdy se rozpočet vede.
 *
 * Číselný zápis schválně: čeština by po „od" chtěla genitiv („od května"),
 * který `Intl` nenabízí, a „Od květen 2026" by bilo do očí.
 */
const sinceLabel = computed(() => {
  const first = store.overall.firstMonth;
  if (!first) return '';

  return new Intl.DateTimeFormat(currentLocale.value, {
    month: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${first}-01T00:00:00.000Z`));
});

const hasEntries = computed(() => store.entries.length > 0);

/* Pruh v přehledu měsíce: základ je to větší z příjmů a odchozích peněz. */
const monthScale = computed(() =>
  Math.max(store.summary.income, store.summary.expenses + store.summary.investments, 1),
);

function barWidth(amount: number): string {
  return `${(amount / monthScale.value) * 100}%`;
}

/** Kliknutí do grafu vývoje otevře ten měsíc rovnou v detailu. */
async function openMonth(month: string): Promise<void> {
  store.month = month;
  await router.push(budgyPath('/mesic'));
}

const sheetOpen = ref(false);
const defaultKind = ref<EntryKind>('income');

function openCreate(kind: EntryKind): void {
  defaultKind.value = kind;
  sheetOpen.value = true;
}
</script>

<template>
  <div>
    <LoadingBlock v-if="store.loading && !hasEntries" />
    <ErrorBlock v-else-if="store.error" :message="translateMessage(store.error)" />

    <EmptyState
      v-else-if="!hasEntries"
      icon="💰"
      :title="t('budgy.empty.title')"
      :description="t('budgy.empty.description')"
    >
      <!-- Hlavní akce patří sem, dokud není co ukázat – ne do rohu obrazovky. -->
      <button type="button" class="btn btn-primary" @click="openCreate('income')">
        + {{ t('budgy.entry.add') }}
      </button>
    </EmptyState>

    <template v-else>
      <!-- Celková čísla: proto je tahle obrazovka přehled a ne jen další měsíc. -->
      <section class="overall">
        <header class="head">
          <h1>{{ t('budgy.overview.title') }}</h1>
          <p v-if="sinceLabel" class="since">
            {{
              t('budgy.overview.since', {
                month: sinceLabel,
                count: t('budgy.overview.monthCount', store.overall.months),
              })
            }}
          </p>
        </header>

        <ul class="totals">
          <li class="total card">
            <p class="label">{{ t('budgy.summary.income') }}</p>
            <p class="amount value income" :class="amountSize(store.overall.income)">
              {{ money(store.overall.income) }}
            </p>
            <p class="per-month">
              {{ t('budgy.overview.perMonth', { amount: money(store.overall.monthlyIncome) }) }}
            </p>
          </li>
          <li class="total card">
            <p class="label">{{ t('budgy.summary.expenses') }}</p>
            <p class="amount value expense" :class="amountSize(store.overall.expenses)">
              {{ money(store.overall.expenses) }}
            </p>
            <p class="per-month">
              {{ t('budgy.overview.perMonth', { amount: money(store.overall.monthlyExpenses) }) }}
            </p>
          </li>
          <li class="total card">
            <p class="label">{{ t('budgy.summary.investments') }}</p>
            <p class="amount value investment" :class="amountSize(store.overall.investments)">
              {{ money(store.overall.investments) }}
            </p>
            <p class="per-month">
              {{ t('budgy.overview.perMonth', { amount: money(store.overall.monthlyInvestments) }) }}
            </p>
          </li>
          <li class="total card">
            <p class="label">{{ t('budgy.overview.saved') }}</p>
            <p
              class="amount value"
              :class="[amountSize(store.overall.remaining), { negative: store.overall.remaining < 0 }]"
            >
              {{ money(store.overall.remaining) }}
            </p>
            <p class="per-month">
              {{
                t('budgy.overview.savedShare', {
                  share: `${Math.round(store.overall.savedShare * 100)} %`,
                })
              }}
            </p>
          </li>
        </ul>
      </section>

      <div class="widgets">
        <!-- Widget: co je teď, s proklikem na podrobnosti měsíce. -->
        <RouterLink :to="budgyPath('/mesic')" class="widget card">
          <header class="widget-head">
            <span class="mono">{{ t('budgy.overview.thisMonth') }}</span>
            <span class="open">{{ t('budgy.overview.openMonth') }} →</span>
          </header>

          <p class="month">{{ monthLabel }}</p>

          <dl class="figures">
            <div>
              <dt>{{ t('budgy.summary.income') }}</dt>
              <dd class="amount income">{{ money(store.summary.income) }}</dd>
            </div>
            <div>
              <dt>{{ t('budgy.summary.expenses') }}</dt>
              <dd class="amount expense">{{ money(store.summary.expenses) }}</dd>
            </div>
            <div>
              <dt>{{ t('budgy.summary.investments') }}</dt>
              <dd class="amount investment">{{ money(store.summary.investments) }}</dd>
            </div>
            <div>
              <dt>{{ t('budgy.summary.remaining') }}</dt>
              <dd class="amount" :class="{ negative: store.summary.remaining < 0 }">
                {{ money(store.summary.remaining) }}
              </dd>
            </div>
          </dl>

          <div class="bars" aria-hidden="true">
            <span class="bar income" :style="{ width: barWidth(store.summary.income) }"></span>
            <span class="bar spent">
              <span class="part expense" :style="{ width: barWidth(store.summary.expenses) }"></span>
              <span
                class="part investment"
                :style="{ width: barWidth(store.summary.investments) }"
              ></span>
            </span>
          </div>
        </RouterLink>

        <section class="widget card trend">
          <header class="widget-head">
            <span class="mono">{{ t('budgy.chart.trend') }}</span>
          </header>
          <TrendChart :months="store.trend" @select="openMonth" />
        </section>
      </div>
    </template>

    <EntrySheet v-model:open="sheetOpen" :entry="null" :default-kind="defaultKind" />
  </div>
</template>

<style scoped>
.head h1 {
  margin: 0;
  font-size: 1.5rem;
}

.since {
  margin: 0.15rem 0 0;
  color: var(--color-muted);
  font-size: var(--text-sm);
}

.totals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.total {
  padding: var(--space-2);
}

.label {
  margin: 0;
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.value {
  margin: 0.2rem 0 0;
  font-size: 1.375rem;
  font-weight: 600;
}

.value.long {
  font-size: 1.125rem;
  letter-spacing: -0.01em;
}

/* Od tabletu je karet víc vedle sebe, ale každá je širší – dlouhá částka se vejde. */
@media (--notebook) {
  .value.long {
    font-size: 1.375rem;
    letter-spacing: normal;
  }
}

.per-month {
  margin: 0.15rem 0 0;
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.income {
  color: var(--color-income);
}

.expense {
  color: var(--color-expense);
}

.investment {
  color: var(--color-investment);
}

.negative {
  color: var(--color-danger);
}

.widgets {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.widget {
  display: block;
  color: inherit;
  text-decoration: none;
}

.widget-head {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  justify-content: space-between;
  color: var(--color-muted);
}

.open {
  color: var(--color-accent);
  font-size: var(--text-sm);
  font-weight: 600;
}

a.widget:hover {
  border-color: var(--color-accent-muted);
}

.month {
  margin: 0.35rem 0 0;
  font-size: 1.5rem;
  font-weight: 600;
  text-transform: capitalize;
}

.figures {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem var(--space-2);
  margin: var(--space-2) 0 0;
}

.figures dt {
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.figures dd {
  margin: 0.1rem 0 0;
  font-size: 1.1875rem;
  font-weight: 600;
}

.bars {
  display: grid;
  gap: 0.35rem;
  margin-top: var(--space-2);
}

.bar {
  display: flex;
  height: 0.5rem;
  min-width: 2px;
  border-radius: 999px;
}

.bar.income {
  background: var(--color-income);
}

/* Odchozí peníze v jednom pruhu: útrata vedle odložené částky. */
.bar.spent {
  gap: 2px;
  background: transparent;
}

.part {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.part.expense {
  background: var(--color-expense);
}

.part.investment {
  background: var(--color-investment);
}

@media (--tablet) {
  .totals {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-2);
  }

  .figures {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .widgets {
    grid-template-columns: 3fr 2fr;
    align-items: start;
  }
}
</style>
