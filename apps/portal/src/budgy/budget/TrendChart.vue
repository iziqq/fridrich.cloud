<script setup lang="ts">
import { formatCurrency, type MonthSummary } from '@fridrich/budgy-shared';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { currentLocale } from '@/i18n';

/**
 * Vývoj posledních měsíců – dvojice sloupců příjmy / výdaje.
 *
 * Sloupce jsou obyčejné `div`y s výškou v procentech, ne SVG: responzivně se
 * roztáhnou samy a odečítat se z nich má jen „kolik z čeho zbývá", ne přesné
 * číslo. To je v popisku měsíce, na který se dá najet.
 */
const props = defineProps<{ months: readonly MonthSummary[] }>();
const emit = defineEmits<{ select: [month: string] }>();

const { t } = useI18n();

/** Měřítko drží všechny měsíce; bez něj by prázdný měsíc vypadal jako plný. */
const scale = computed(() =>
  Math.max(...props.months.map((month) => Math.max(month.income, month.expenses)), 1),
);

function height(amount: number): string {
  return `${Math.max((amount / scale.value) * 100, amount > 0 ? 3 : 0)}%`;
}

/** Krátký popisek měsíce – „říj", „lis". */
function shortLabel(month: string): string {
  const date = new Date(`${month}-01T00:00:00.000Z`);
  return new Intl.DateTimeFormat(currentLocale.value, { month: 'short', timeZone: 'UTC' }).format(
    date,
  );
}

function summaryLabel(month: MonthSummary): string {
  return t('budgy.chart.monthSummary', {
    month: month.month,
    income: formatCurrency(month.income, currentLocale.value),
    expenses: formatCurrency(month.expenses, currentLocale.value),
  });
}
</script>

<template>
  <div class="trend">
    <ul class="months">
      <li v-for="month in months" :key="month.month" class="month">
        <button
          type="button"
          class="bars"
          :title="summaryLabel(month)"
          :aria-label="summaryLabel(month)"
          @click="emit('select', month.month)"
        >
          <span class="bar income" :style="{ height: height(month.income) }"></span>
          <span class="bar expense" :style="{ height: height(month.expenses) }"></span>
        </button>
        <span class="label">{{ shortLabel(month.month) }}</span>
      </li>
    </ul>

    <p class="legend">
      <span class="key"><span class="dot income"></span>{{ t('budgy.chart.income') }}</span>
      <span class="key"><span class="dot expense"></span>{{ t('budgy.chart.expenses') }}</span>
    </p>
  </div>
</template>

<style scoped>
.months {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 0.35rem;
  align-items: end;
  height: 8rem;
}

.month {
  display: grid;
  gap: 0.35rem;
  height: 100%;
  grid-template-rows: 1fr auto;
}

/*
 * Sloupce jsou tlačítko: kliknutím se obrazovka přepne na ten měsíc, takže
 * graf není jen obrázek, ale i navigace.
 */
.bars {
  display: flex;
  gap: 0.2rem;
  align-items: flex-end;
  justify-content: center;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
}

.bars:hover {
  background: var(--slate-100);
}

.bar {
  width: 0.55rem;
  min-height: 2px;
  border-radius: 999px 999px 0 0;
  transition: height var(--dur-base) var(--ease);
}

.bar.income,
.dot.income {
  background: var(--color-income);
}

.bar.expense,
.dot.expense {
  background: var(--color-expense);
}

.label {
  color: var(--color-muted);
  font-size: 0.75rem;
  text-align: center;
}

.legend {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  margin: var(--space-1) 0 0;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.key {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
}

.dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
}
</style>
