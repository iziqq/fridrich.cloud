<script setup lang="ts">
import { entriesKeys, formatCurrency, type CategoryShare } from '@fridrich/budgy-shared';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { currentLocale } from '@/i18n';
import { CATEGORY_COLORS } from '../categoryColors';

/**
 * Výdaje měsíce jako mezikruží s legendou.
 *
 * Kreslí se ručně v SVG, ne knihovnou: jeden prstenec a pár obdélníků nestojí
 * za dalších sto kilobajtů v balíku a takhle se barvy i písmo berou z tokenů
 * produktu. Výseče jsou obtažené kružnice – `stroke-dasharray` udělá délku
 * oblouku a `stroke-dashoffset` jeho začátek.
 */
const props = defineProps<{ slices: readonly CategoryShare[]; total: number }>();

const { t } = useI18n();

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Mezera mezi výsečemi – u drobných kategorií by ji nebylo z čeho ubrat. */
const GAP = 1.5;

const arcs = computed(() => {
  let offset = 0;

  return props.slices.map((slice) => {
    const length = Math.max(slice.share * CIRCUMFERENCE - GAP, 0.5);
    const arc = {
      category: slice.category,
      color: CATEGORY_COLORS[slice.category],
      dash: `${length} ${CIRCUMFERENCE - length}`,
      offset: -offset,
    };

    offset += slice.share * CIRCUMFERENCE;
    return arc;
  });
});

function money(amount: number): string {
  return formatCurrency(amount, currentLocale.value);
}

/** Procenta na celá čísla – „12,4 %" v legendě nikdo nepotřebuje. */
function percent(share: number): string {
  return `${Math.round(share * 100)} %`;
}
</script>

<template>
  <div class="donut-block">
    <div class="chart">
      <svg viewBox="0 0 160 160" role="img" :aria-label="t('budgy.chart.donutLabel')">
        <!-- Podklad prstence, aby kruh držel tvar i s jedinou malou výsečí. -->
        <circle class="track" cx="80" cy="80" :r="RADIUS" />

        <circle
          v-for="arc in arcs"
          :key="arc.category"
          cx="80"
          cy="80"
          :r="RADIUS"
          :stroke="arc.color"
          :stroke-dasharray="arc.dash"
          :stroke-dashoffset="arc.offset"
          class="arc"
        />
      </svg>

      <div class="center">
        <p class="label">{{ t('budgy.chart.expenses') }}</p>
        <p class="amount total">{{ money(total) }}</p>
      </div>
    </div>

    <ul class="legend">
      <li v-for="slice in slices" :key="slice.category" class="row">
        <span class="dot" :style="{ background: CATEGORY_COLORS[slice.category] }"></span>
        <span class="name">{{ t(entriesKeys.category[slice.category]) }}</span>
        <span class="share">{{ percent(slice.share) }}</span>
        <span class="amount value">{{ money(slice.amount) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.donut-block {
  display: grid;
  gap: var(--space-2);
  align-items: center;
}

.chart {
  position: relative;
  justify-self: center;
  width: min(14rem, 100%);
}

svg {
  display: block;
  width: 100%;
  height: auto;
  /* Nula stupňů je vpravo; otočením začíná první výseč nahoře. */
  transform: rotate(-90deg);
}

.arc,
.track {
  fill: none;
  stroke-width: 20;
}

.track {
  stroke: var(--slate-100);
}

.center {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
}

.center .label {
  margin: 0;
  color: var(--color-muted);
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Střed musí zůstat uvnitř díry prstence, i když je prstenec malý. */
.total {
  margin: 0.15rem 0 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.legend {
  display: grid;
  gap: 0.15rem;
}

.row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 0.5rem;
  align-items: baseline;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-sm);
}

.row:last-child {
  border-bottom: 0;
}

.dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 999px;
  transform: translateY(0.05rem);
}

.name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.share {
  color: var(--color-muted);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.value {
  font-weight: 600;
  white-space: nowrap;
}

/*
 * Vedle sebe až od notebooku. Na tabletu stojí karta v polovině šířky, takže
 * by na legendu zbylo tak málo, že by se názvy kategorií ořízly na písmeno.
 */
@media (--notebook) {
  .donut-block {
    grid-template-columns: 10rem minmax(0, 1fr);
    gap: var(--space-2);
    align-items: center;
  }
}
</style>
