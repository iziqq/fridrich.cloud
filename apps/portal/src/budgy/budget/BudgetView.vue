<script setup lang="ts">
import {
  entriesKeys,
  formatCurrency,
  type BudgetEntry,
  type EntryKind,
} from '@fridrich/budgy-shared';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import EmptyState from '@/components/product/EmptyState.vue';
import ErrorBlock from '@/components/product/ErrorBlock.vue';
import FabButton from '@/components/product/FabButton.vue';
import LoadingBlock from '@/components/product/LoadingBlock.vue';
import { askConfirm } from '@/components/product/confirm';
import { RouterLink } from 'vue-router';
import { currentLocale, translateMessage } from '@/i18n';
import { CATEGORY_COLORS } from '../categoryColors';
import EntrySheet from './EntrySheet.vue';
import ExpenseDonut from './ExpenseDonut.vue';
import TrendChart from './TrendChart.vue';
import { useBudgetStore } from './budget.store';

/**
 * Rozpočet jednoho měsíce.
 *
 * Nahoře čísla, pod nimi grafy, dole položky po sekcích – příjmy, pravidelné
 * a jednorázové výdaje. Měsíc se přepíná v hlavičce nebo kliknutím do grafu
 * vývoje (doc/wiki/domains/budgyBudget.md).
 */
const store = useBudgetStore();
const { t } = useI18n();

onMounted(() => store.load());

function money(amount: number): string {
  return formatCurrency(amount, currentLocale.value);
}

/** Nadpis měsíce – „říjen 2026", v jazyce rozhraní. */
const monthLabel = computed(() =>
  new Intl.DateTimeFormat(currentLocale.value, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${store.month}-01T00:00:00.000Z`)),
);

/** Měsíc `RRRR-MM` jako „3/2027" – syrové ISO se v popisku čte špatně. */
function monthShort(month: string): string {
  return new Intl.DateTimeFormat(currentLocale.value, {
    month: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00.000Z`));
}

/** Den útraty bez roku – v seznamu měsíce by se rok jen opakoval. */
function dayLabel(date: string | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat(currentLocale.value, {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`));
}

const hasEntries = computed(() => store.entries.length > 0);

/*
 * Pruh příjmů a výdajů.
 *
 * Základ je ten větší z obou, takže pruhy jdou porovnat mezi sebou: když
 * výdaje přerostou příjmy, je vidět přesně o kolik.
 */
const barScale = computed(() =>
  Math.max(store.summary.income, store.summary.expenses + store.summary.investments, 1),
);

function barWidth(amount: number): string {
  return `${(amount / barScale.value) * 100}%`;
}

/*
 * Sekce jdou v pořadí, v jakém se rozpočet čte: co přijde, co odchází samo,
 * co jsme utratili. Popisky se skládají z klíče sekce, aby k sobě nadpis,
 * prázdný stav i tlačítko patřily i v katalogu.
 */
const sectionList = computed(() => [
  {
    key: 'income' as const,
    entries: store.sections.income,
    kind: 'income' as EntryKind,
    total: store.summary.income,
  },
  {
    key: 'recurring' as const,
    entries: store.sections.recurring,
    kind: 'expense' as EntryKind,
    total: store.summary.recurringExpenses,
  },
  {
    key: 'oneOff' as const,
    entries: store.sections.oneOff,
    kind: 'expense' as EntryKind,
    total: store.summary.oneOffExpenses,
  },
  {
    key: 'investments' as const,
    entries: store.sections.investments,
    kind: 'investment' as EntryKind,
    total: store.summary.investments,
  },
]);

/* --- Formulář --- */

const sheetOpen = ref(false);
const editing = ref<BudgetEntry | null>(null);
const defaultKind = ref<EntryKind>('expense');

function openCreate(kind: EntryKind): void {
  editing.value = null;
  defaultKind.value = kind;
  sheetOpen.value = true;
}

function openEdit(entry: BudgetEntry): void {
  editing.value = entry;
  defaultKind.value = entry.kind;
  sheetOpen.value = true;
}

async function removeEntry(entry: BudgetEntry): Promise<void> {
  const confirmed = await askConfirm({
    title: t('budgy.entry.delete'),
    message: t('budgy.entry.confirmDelete', { name: entry.name }),
    confirmLabel: t('budgy.entry.delete'),
    danger: true,
  });
  if (!confirmed) return;

  await store.remove(entry.id);
  if (editing.value?.id === entry.id) sheetOpen.value = false;
}

/**
 * Barva proužku u položky.
 *
 * Výdaj nese barvu své kategorie (stejnou jako v grafu), příjem a investice
 * barvu svého druhu – jinak by investice bez kategorie vypadala jako příjem.
 */
function swatchColor(entry: BudgetEntry): string {
  if (entry.kind === 'investment') return 'var(--color-investment)';
  if (entry.kind === 'income') return 'var(--color-income)';

  return entry.category ? CATEGORY_COLORS[entry.category] : 'var(--color-expense)';
}

/** Popisek pod názvem – u výdaje kategorie, u jednorázové položky i den. */
function entryMeta(entry: BudgetEntry): string {
  const parts: string[] = [];

  // U propsané platby řekne, která to je – záloha, doplatek, nebo celá.
  if (entry.source) parts.push(t(entriesKeys.sourcePart[entry.source.part]));

  if (entry.recurrence === 'once' && entry.date) parts.push(dayLabel(entry.date));
  if (entry.category) parts.push(t(entriesKeys.category[entry.category]));
  if (entry.endsOn) parts.push(t('budgy.entry.until', { month: monthShort(entry.endsOn) }));

  return parts.join(' · ');
}
</script>

<template>
  <div>
    <header class="head">
      <div class="title">
        <p class="mono">{{ t('budgy.title') }}</p>
        <div class="month-switch">
          <button
            type="button"
            class="nav"
            :aria-label="t('budgy.month.previous')"
            @click="store.goToMonth(-1)"
          >
            ‹
          </button>
          <h1>{{ monthLabel }}</h1>
          <button
            type="button"
            class="nav"
            :aria-label="t('budgy.month.next')"
            :disabled="!store.canGoForward"
            @click="store.goToMonth(1)"
          >
            ›
          </button>
        </div>
      </div>

      <button
        v-if="store.canGoForward"
        type="button"
        class="btn btn-ghost today"
        @click="store.goToCurrentMonth()"
      >
        {{ t('budgy.month.current') }}
      </button>
    </header>

    <LoadingBlock v-if="store.loading && !hasEntries" />
    <ErrorBlock v-else-if="store.error" :message="translateMessage(store.error)" />

    <template v-else>
      <!-- Přehled měsíce: tři čísla a pruh, ze kterého je poměr vidět na první pohled. -->
      <section class="summary card">
        <div class="figures">
          <div class="figure">
            <p class="label">{{ t('budgy.summary.income') }}</p>
            <p class="amount value income">{{ money(store.summary.income) }}</p>
          </div>
          <div class="figure">
            <p class="label">{{ t('budgy.summary.expenses') }}</p>
            <p class="amount value expense">{{ money(store.summary.expenses) }}</p>
          </div>
          <div class="figure">
            <p class="label">{{ t('budgy.summary.investments') }}</p>
            <p class="amount value investment">{{ money(store.summary.investments) }}</p>
          </div>
          <div class="figure">
            <p class="label">{{ t('budgy.summary.remaining') }}</p>
            <p
              class="amount value remaining"
              :class="{ negative: store.summary.remaining < 0 }"
            >
              {{ money(store.summary.remaining) }}
            </p>
          </div>
        </div>

        <!-- Bez čísel není co kreslit – dva nulové pahýly by jen mátly. -->
        <div
          v-if="store.summary.income > 0 || store.summary.expenses > 0"
          class="bars"
          aria-hidden="true"
        >
          <span class="bar income" :style="{ width: barWidth(store.summary.income) }"></span>
          <span class="bar expense" :style="{ width: barWidth(store.summary.expenses) }"></span>
          <span
            v-if="store.summary.investments > 0"
            class="bar investment"
            :style="{ width: barWidth(store.summary.investments) }"
          ></span>
        </div>

        <p v-if="store.summary.income > 0" class="note">
          {{
            store.summary.remaining >= 0
              ? t('budgy.summary.savedShare', { share: `${Math.round(store.summary.savedShare * 100)} %` })
              : t('budgy.summary.overspent', { amount: money(-store.summary.remaining) })
          }}
        </p>
      </section>

      <EmptyState
        v-if="!hasEntries"
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
        <div class="charts">
          <section class="card chart-card">
            <h2>{{ t('budgy.chart.byCategory') }}</h2>
            <ExpenseDonut
              v-if="store.summary.byCategory.length > 0"
              :slices="store.summary.byCategory"
              :total="store.summary.expenses"
            />
            <p v-else class="note">{{ t('budgy.chart.noExpenses') }}</p>
          </section>

          <section class="card chart-card">
            <h2>{{ t('budgy.chart.trend') }}</h2>
            <TrendChart :months="store.trend" @select="store.month = $event" />
          </section>
        </div>

        <section v-for="section in sectionList" :key="section.key" class="entries">
          <header class="section-head">
            <h2>{{ t(`budgy.sections.${section.key}`) }}</h2>
            <p class="amount section-total">{{ money(section.total) }}</p>
          </header>

          <p v-if="section.entries.length === 0" class="note empty-row">
            {{ t(`budgy.sections.${section.key}Empty`) }}
          </p>

          <ul v-else class="list">
            <li v-for="entry in section.entries" :key="entry.id" class="entry card">
              <span
                class="swatch"
                :style="{ background: swatchColor(entry) }"
                aria-hidden="true"
              ></span>

              <div class="info">
                <p class="name">{{ entry.name }}</p>
                <p v-if="entryMeta(entry)" class="meta">{{ entryMeta(entry) }}</p>
                <!-- Propsanou platbu mění aplikace, ze které přišla – tam se dá prokliknout. -->
                <RouterLink v-if="entry.source?.path" :to="entry.source.path" class="source">
                  {{ t('budgy.entry.fromApp', { app: t(entriesKeys.sourceApp[entry.source.app]) }) }}
                </RouterLink>
              </div>

              <p class="amount value" :class="entry.kind">
                {{ entry.kind === 'income' ? '+' : '−' }}{{ money(entry.amount) }}
              </p>

              <div v-if="!entry.source" class="controls">
                <button type="button" class="icon-button" @click="openEdit(entry)">
                  <span class="visually-hidden">{{ t('budgy.entry.edit') }}</span>
                  <span aria-hidden="true">✏️</span>
                </button>
                <button type="button" class="icon-button" @click="removeEntry(entry)">
                  <span class="visually-hidden">{{ t('budgy.entry.delete') }}</span>
                  <span aria-hidden="true">🗑️</span>
                </button>
              </div>
            </li>
          </ul>

          <button type="button" class="btn btn-secondary add" @click="openCreate(section.kind)">
            + {{ t(`budgy.sections.${section.key}Add`) }}
          </button>
        </section>
      </template>
    </template>

    <FabButton v-if="hasEntries" :label="t('budgy.entry.add')" @click="openCreate('expense')" />

    <EntrySheet v-model:open="sheetOpen" :entry="editing" :default-kind="defaultKind" />
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
  align-items: end;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.title .mono {
  margin: 0;
  color: var(--color-muted);
}

.month-switch {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.month-switch h1 {
  margin: 0;
  font-size: 1.5rem;
  /* První písmeno měsíce vrací Intl malé, na začátku nadpisu chceme velké. */
  text-transform: capitalize;
}

.nav {
  display: grid;
  place-items: center;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.nav:hover:not(:disabled) {
  background: var(--slate-100);
  color: var(--color-text);
}

.nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.today {
  font-size: var(--text-sm);
}

.summary {
  margin-bottom: var(--space-3);
}

.figures {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2) var(--space-1);
}

.figure .label {
  margin: 0;
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.value {
  margin: 0.15rem 0 0;
  font-size: 1.3125rem;
  font-weight: 600;
  white-space: nowrap;
}

.income {
  color: var(--color-income);
}

.expense {
  color: var(--color-expense);
}

.remaining {
  color: var(--color-text);
}

.remaining.negative {
  color: var(--color-danger);
}

.bars {
  display: grid;
  gap: 0.35rem;
  margin-top: var(--space-2);
}

.bar {
  display: block;
  height: 0.5rem;
  min-width: 2px;
  border-radius: 999px;
  transition: width var(--dur-base) var(--ease);
}

.bar.income {
  background: var(--color-income);
}

.bar.expense {
  background: var(--color-expense);
}

.bar.investment {
  background: var(--color-investment);
}

.investment {
  color: var(--color-investment);
}

.note {
  margin: var(--space-1) 0 0;
  color: var(--color-muted);
  font-size: var(--text-sm);
}

.charts {
  display: grid;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.chart-card h2,
.section-head h2 {
  margin: 0 0 var(--space-1);
  font-size: 1rem;
}

.entries + .entries {
  margin-top: var(--space-3);
}

.section-head {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  justify-content: space-between;
}

.section-head h2 {
  margin-bottom: 0;
}

.section-total {
  margin: 0;
  color: var(--color-muted);
  font-weight: 600;
}

.list {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/*
 * Na mobilu jde částka pod název, ne vedle něj: vedle tlačítek by na jméno
 * zbylo tak málo, že by se „Mobil a internet" ořízl na „Mobil a i…".
 */
.entry {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.15rem 0.75rem;
  align-items: center;
  padding: 0.6rem var(--space-2);
}

.swatch {
  grid-row: 1 / -1;
}

.entry .info {
  grid-column: 2;
  grid-row: 1;
}

.entry .value {
  grid-column: 2;
  grid-row: 2;
  margin: 0;
  font-size: 1.0625rem;
}

.controls {
  grid-column: 3;
  grid-row: 1 / -1;
}

.swatch {
  width: 0.5rem;
  height: 2rem;
  border-radius: 999px;
}

.name {
  margin: 0;
  overflow: hidden;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.meta {
  margin: 0.1rem 0 0;
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.controls {
  display: flex;
  gap: 0.15rem;
}

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

.icon-button:hover {
  background: var(--slate-100);
}

.source {
  display: inline-flex;
  align-items: center;
  min-height: 1.75rem;
  color: var(--color-accent);
  font-size: var(--text-xs);
  font-weight: 600;
  text-decoration: none;
}

.empty-row {
  margin: 0.35rem 0 0;
}

.add {
  margin-top: 0.5rem;
  font-size: var(--text-sm);
}

@media (--tablet) {
  .charts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  /* Od tabletu je místo, aby částka stála v samostatném sloupci. */
  .entry {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
  }

  .entry .value {
    grid-column: 3;
    grid-row: 1;
    font-size: 1.0625rem;
  }

  .controls {
    grid-column: 4;
  }

  .figures {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-2);
  }

  .value {
    font-size: 1.375rem;
  }
}
</style>
