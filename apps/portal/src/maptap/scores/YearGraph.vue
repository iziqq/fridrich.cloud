<script setup lang="ts">
import type { YearDay } from '@fridrich/maptap-shared';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { currentLocale } from '@/i18n';

/**
 * Pás posledního roku – jeden čtvereček je jeden den.
 *
 * Sloupec je týden, řádek den v týdnu (od pondělí, web je český). Barva
 * říká, jak hráč ten den dopadl: čím lepší pořadí, tím sytější oranžová.
 * Kliknutím se den otevře (doc/wiki/domains/maptapScores.md).
 */
const props = defineProps<{ days: readonly YearDay[]; label: string }>();
const emit = defineEmits<{ select: [day: string] }>();

const { t } = useI18n();

const frame = ref<HTMLElement | null>(null);
const scroller = ref<HTMLElement | null>(null);
const grid = ref<HTMLElement | null>(null);

function asDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

/*
 * Formátovače se staví jednou, ne u každého z 365 čtverečků – jejich
 * vytvoření je to nejdražší na celém vykreslení.
 */
const dayFormat = computed(
  () =>
    new Intl.DateTimeFormat(currentLocale.value, {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }),
);
const monthFormat = computed(
  () => new Intl.DateTimeFormat(currentLocale.value, { month: 'short', timeZone: 'UTC' }),
);

/** Pondělí = 0. */
function weekday(day: string): number {
  return (asDate(day).getUTCDay() + 6) % 7;
}

/** Prázdná místa před prvním dnem, aby čtverečky seděly na dny v týdnu. */
const leading = computed(() => (props.days[0] ? weekday(props.days[0].day) : 0));

/**
 * Popisek měsíce stojí nad týdnem, ve kterém měsíc začíná.
 *
 * Když dva začátky padnou do sousedních sloupců, druhý se vynechá – slily
 * by se do sebe a nepřečetl by se ani jeden.
 */
const months = computed(() => {
  const labels: { column: number; text: string }[] = [];

  props.days.forEach((entry, index) => {
    if (!entry.day.endsWith('-01')) return;

    const column = Math.floor((leading.value + index) / 7) + 1;
    const previous = labels.at(-1);
    if (previous && column - previous.column < 3) return;

    labels.push({ column, text: monthFormat.value.format(asDate(entry.day)) });
  });

  return labels;
});

/** Čím lepší pořadí, tím sytější barva; bez výsledku zůstane čtvereček prázdný. */
function level(entry: YearDay): number {
  if (!entry.rank) return 0;
  return Math.max(1, 5 - entry.rank);
}

const labels = computed(() =>
  props.days.map((entry) => {
    const date = dayFormat.value.format(asDate(entry.day));

    if (entry.rank) {
      const rank = t('maptap.year.rankOf', { rank: entry.rank, players: entry.players });
      return `${date} · ${rank} · ${t('maptap.year.points', { score: entry.score })}`;
    }

    const rest =
      entry.players > 0
        ? t('maptap.year.missed', { players: entry.players })
        : t('maptap.year.noPlay');
    return `${date} · ${rest}`;
  }),
);

/* --- Bublina s popiskem --- */

const tip = ref<{ text: string; x: number; y: number } | null>(null);

/**
 * Bublina visí mimo posuvnou část, jinak by ji ořízl její `overflow`.
 * U krajů se přitiskne dovnitř, aby nevylezla z karty.
 */
function showTip(index: number, event: Event): void {
  const square = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const box = frame.value?.getBoundingClientRect();
  const text = labels.value[index];
  if (!box || !text) return;

  const center = square.left - box.left + square.width / 2;
  tip.value = {
    text,
    x: Math.min(Math.max(center, 80), box.width - 80),
    y: square.top - box.top,
  };
}

/* --- Ovládání --- */

/**
 * Celý pás je jedna zastávka tabulátorem a uvnitř se chodí šipkami.
 * 365 zastávek za sebou by z klávesnice udělalo past.
 */
const active = ref(0);

onMounted(() => {
  active.value = Math.max(props.days.length - 1, 0);
  // Nejnovější dny jsou vpravo a zajímají nejvíc, takže pás začíná u nich.
  nextTick(() => scroller.value?.scrollTo({ left: scroller.value.scrollWidth }));
});

function move(delta: number): void {
  active.value = Math.min(Math.max(active.value + delta, 0), props.days.length - 1);

  nextTick(() => {
    const square = grid.value?.querySelectorAll<HTMLElement>('.square')[active.value];
    square?.focus();
    square?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}

/** Sloupec je týden, řádek den – šipka doprava je tedy skok o týden. */
function onKeydown(event: KeyboardEvent): void {
  const steps: Record<string, number> = {
    ArrowRight: 7,
    ArrowLeft: -7,
    ArrowDown: 1,
    ArrowUp: -1,
  };

  const step = steps[event.key];
  if (step === undefined) return;

  event.preventDefault();
  move(step);
}

function open(entry: YearDay): void {
  // Den, ve kterém nikdo nehrál, nemá co ukázat.
  if (entry.players > 0) emit('select', entry.day);
}
</script>

<template>
  <div ref="frame" class="frame">
    <div ref="scroller" class="scroller">
      <div class="track">
        <ol class="months" aria-hidden="true">
          <li v-for="month in months" :key="month.column" :style="{ gridColumn: month.column }">
            {{ month.text }}
          </li>
        </ol>

        <ol ref="grid" class="grid" :aria-label="label" @keydown="onKeydown">
          <li v-for="blank in leading" :key="`blank-${blank}`" class="blank" aria-hidden="true"></li>

          <li v-for="(entry, index) in days" :key="entry.day">
            <button
              type="button"
              class="square"
              :class="[`lvl-${level(entry)}`, { quiet: entry.players === 0 }]"
              :tabindex="index === active ? 0 : -1"
              :aria-label="labels[index]"
              @click="open(entry)"
              @mouseenter="showTip(index, $event)"
              @focus="showTip(index, $event)"
              @mouseleave="tip = null"
              @blur="tip = null"
            ></button>
          </li>
        </ol>
      </div>
    </div>

    <p v-if="tip" class="tip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }" aria-hidden="true">
      {{ tip.text }}
    </p>

  </div>
</template>

<style scoped>
.frame {
  position: relative;
  /* Ať se pás nechá zúžit a posouval se uvnitř, místo aby tlačil do stránky. */
  min-width: 0;
  --cell: 10px;
  --gap: 2px;
}

/*
 * Rok po týdnech je skoro 70 cm čtverečků – na telefon se nevejde a zalomit
 * ho nejde, aniž by přestal být kalendářem. Posouvá se proto uvnitř karty;
 * stránka sama se vodorovně neposouvá.
 */
.scroller {
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: thin;
}

.track {
  display: grid;
  gap: 0.25rem;
  width: max-content;
}

.months,
.grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--cell);
  gap: var(--gap);
}

.months li {
  grid-row: 1;
  color: var(--color-muted);
  font-size: var(--text-xs);
  line-height: 1;
  white-space: nowrap;
}

.grid {
  grid-template-rows: repeat(7, var(--cell));
}

.square {
  display: block;
  width: var(--cell);
  height: var(--cell);
  padding: 0;
  border: 0;
  border-radius: 2px;
  cursor: pointer;
  transition: outline-color var(--dur-fast) var(--ease);
  outline: 1px solid transparent;
  outline-offset: 1px;
}

/* Den, ve kterém nikdo nehrál, se otevřít nedá – ať to kurzor řekne dřív než klik. */
.square.quiet {
  cursor: default;
}

.square:hover:not(.quiet),
.square:focus-visible {
  outline-color: var(--color-text);
}

/* --- Bublina --- */

.tip {
  position: absolute;
  z-index: 5;
  margin: 0;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  color: var(--color-text);
  font-size: var(--text-xs);
  white-space: nowrap;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 0.4rem));
}

</style>
