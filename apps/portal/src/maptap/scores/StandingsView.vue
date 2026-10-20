<script setup lang="ts">
import { yearByPlayer } from '@fridrich/maptap-shared';
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import EmptyState from '@/components/product/EmptyState.vue';
import ErrorBlock from '@/components/product/ErrorBlock.vue';
import LoadingBlock from '@/components/product/LoadingBlock.vue';
import { currentLocale, translateMessage } from '@/i18n';
import { useAuthStore } from '@/identity/auth.store';
import { maptapPath } from '../routes';
import YearGraph from './YearGraph.vue';
import { useBoardStore } from './board.store';

/**
 * Celkové pořadí.
 *
 * Řadí **součet nejlepších her** – tolika, kolik se tu na hráče v průměru
 * odehraje. Kdo tolik her ještě nemá, stojí pod oranžovou čarou: jeho součet
 * je z podstaty kratší, takže by mezi ostatními vypadal jako slabý výkon
 * (doc/wiki/domains/maptapScores.md).
 *
 * Tabulka se na mobilu nekreslí jako tabulka: pět sloupců se na 360 px
 * nevejde, takže je z každého hráče karta (CLAUDE.md, pravidlo 24).
 */
const store = useBoardStore();
const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();

onMounted(() => store.load());

/** Posledních 365 dní pro každého hráče – jedním průchodem pro celou tabuli. */
const years = computed(() => yearByPlayer(store.board, store.currentDay));

/** Kliknutí do pásu přepne na ten den v záložce Den. */
async function openDay(day: string): Promise<void> {
  store.day = day;
  await router.push(maptapPath());
}

function number(value: number): string {
  return new Intl.NumberFormat(currentLocale.value, { maximumFractionDigits: 1 }).format(value);
}

/*
 * Obě skupiny se kreslí stejným řádkem, jen je mezi nimi čára – proto jeden
 * `v-for` přes skupiny místo dvou opsaných seznamů.
 */
const groups = computed(() =>
  [
    { key: 'ranked', rows: store.table.ranked },
    { key: 'occasional', rows: store.table.occasional },
  ].filter((group) => group.rows.length > 0),
);

const occasionalNote = computed(() =>
  t('maptap.standings.occasionalNote', {
    games: t('maptap.standings.gameCount', store.table.counted),
  }),
);
</script>

<template>
  <div>
    <header class="head">
      <h1>{{ t('maptap.standings.title') }}</h1>
      <p v-if="groups.length > 0" class="hint">
        {{ t('maptap.standings.hint', { count: store.table.counted }) }}
      </p>
      <p v-if="groups.length > 0" class="hint">{{ t('maptap.year.hint') }}</p>

      <!-- Legenda pásu stojí jednou nahoře; u každého hráče by jen překážela. -->
      <ul v-if="groups.length > 0" class="legend" :aria-label="t('maptap.year.legend')">
        <li><span class="swatch lvl-4"></span>{{ t('maptap.year.legendFirst') }}</li>
        <li><span class="swatch lvl-3"></span>{{ t('maptap.year.legendSecond') }}</li>
        <li><span class="swatch lvl-2"></span>{{ t('maptap.year.legendThird') }}</li>
        <li><span class="swatch lvl-1"></span>{{ t('maptap.year.legendRest') }}</li>
        <li><span class="swatch lvl-0"></span>{{ t('maptap.year.legendNone') }}</li>
      </ul>
    </header>

    <LoadingBlock v-if="store.loading && store.board.scores.length === 0" />
    <ErrorBlock v-else-if="store.error" :message="translateMessage(store.error)" />

    <EmptyState
      v-else-if="groups.length === 0"
      icon="🏅"
      :title="t('maptap.standings.emptyTitle')"
      :description="t('maptap.standings.emptyDescription')"
    />

    <template v-else>
      <template v-for="group in groups" :key="group.key">
        <!-- Čára dělí ty, kdo hrají pravidelně, od zbytku. -->
        <div v-if="group.key === 'occasional'" class="break">
          <hr class="split" />
          <p class="note">{{ occasionalNote }}</p>
        </div>

        <ol class="rows">
          <li
            v-for="row in group.rows"
            :key="row.player.id"
            class="row card"
            :class="{ mine: row.player.id === auth.user?.id }"
          >
            <div class="scores">
              <div class="who">
                <p class="rank" :class="row.rank ? `rank-${row.rank}` : ''" aria-hidden="true">
                  {{ row.rank ?? '–' }}
                </p>
                <p class="name">
                  {{ row.player.name }}
                  <span class="visually-hidden">
                    {{
                      row.rank
                        ? t('maptap.day.rank', { rank: row.rank })
                        : t('maptap.standings.unranked')
                    }}
                  </span>
                </p>
                <p class="headline">
                  <span class="score">{{ number(row.score) }}</span>
                  <!--
                    Co to velké číslo je: podle něj se řadí, takže nesmí být hádanka.
                    Pod čarou je to z podstaty součet všech her, ne nejlepších –
                    tolik jich hráč ještě nemá, a popisek by tvrdil něco jiného.
                  -->
                  <span class="unit">
                    {{
                      row.rank
                        ? t('maptap.standings.scoreLabel', store.table.counted)
                        : t('maptap.standings.allLabel')
                    }}
                  </span>
                </p>
              </div>

              <dl class="stats">
                <div>
                  <dt>{{ t('maptap.standings.games') }}</dt>
                  <dd class="score">{{ row.games }}</dd>
                </div>
                <div>
                  <dt>{{ t('maptap.standings.wins') }}</dt>
                  <dd class="score">{{ row.wins }}</dd>
                </div>
                <div>
                  <dt>{{ t('maptap.standings.best') }}</dt>
                  <dd class="score">{{ row.best }}</dd>
                </div>
                <div>
                  <dt>{{ t('maptap.standings.average') }}</dt>
                  <dd class="score">{{ number(row.average) }}</dd>
                </div>
              </dl>
            </div>

             <YearGraph
                :days="years.get(row.player.id) ?? []"
                :label="t('maptap.year.label', { name: row.player.name })"
                @select="openDay"
              />
          </li>
        </ol>
      </template>
    </template>
  </div>
</template>

<style scoped>
.head {
  margin-bottom: var(--space-2);
}

.head h1 {
  margin: 0;
  font-size: 1.5rem;
}

.hint {
  margin: 0.15rem 0 0;
  color: var(--color-muted);
  font-size: var(--text-sm);
}

/* --- Legenda pásu --- */

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.75rem;
  margin-top: var(--space-1);
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.legend li {
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

/* --- Řádky --- */

/*
 * Karty se tu šířku nedrží zkrátka: vedle čísel stojí rok po dnech, a ten
 * potřebuje přes 600 px, aby se nemusel posouvat. Jméno a výsledek proto
 * drží pohromadě `.who` níž.
 */
.rows {
  display: grid;
  /*
   * Sloupec musí umět být užší než obsah. Bez `minmax(0, …)` se karta
   * roztáhne podle pásu roku (přes 600 px) a odtáhne s sebou celou stránku
   * do vodorovného posuvníku – na telefonu je to vidět hned.
   */
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-1);
}

/* --- Čára mezi pravidelnými hráči a zbytkem --- */

.break {
  margin-block: var(--space-3) var(--space-2);
}

.split {
  height: 2.5px;
  margin: 0;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
}

.note {
  margin: 0.5rem 0 0;
  color: var(--color-muted);
  font-size: var(--text-sm);
}

/* --- Řádek hráče --- */

/*
 * Čísla a vedle nich rok. Vedle sebe se vejdou až na notebooku – pás
 * potřebuje přes 600 px, takže na užší obrazovce jdou pod sebe. Základ je
 * ten užší stav, širší se přidává breakpointem (CLAUDE.md, pravidlo 24).
 */
.row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/*
 * Flexová položka se sama od sebe nezúží pod svůj obsah. Bez tohohle by
 * široký pás roztáhl kartu a s ní celou stránku do vodorovného posuvníku.
 */
.row > * {
  min-width: 0;
}

@media (--notebook) {
  .row {
    flex-direction: row;
    gap: var(--space-6);
  }

  /*
   * Rozdělení šířky patří jen do řádkového režimu: `flex-basis` míří na
   * hlavní osu, takže ve sloupci by z něj byla výška a v kartě by zela díra.
   */
  .scores {
    flex: 1 1 18rem;
  }
}

.row.mine {
  border-color: var(--color-accent-muted);
}

.who {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-1);
  align-items: baseline;
}

.rank {
  margin: 0;
  min-width: 1.5rem;
  color: var(--color-muted);
  font-size: 1.25rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

/* Pás se smí zúžit a posouvat; levý blok si šířku hlídá až v řádku níž. */
.scores {
  min-width: 0;
}

.rank-1 {
  color: var(--color-rank-1);
}

.rank-2 {
  color: var(--color-rank-2);
}

.rank-3 {
  color: var(--color-rank-3);
}

.name {
  margin: 0;
  font-weight: 600;
  /* Zalomí jen slovo, které se opravdu nevejde – ne „Procházko-vá". */
  overflow-wrap: break-word;
}

.headline {
  display: grid;
  justify-items: end;
  margin: 0;
  color: var(--color-accent);
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.1;
}

.headline .unit {
  color: var(--color-muted);
  font-size: var(--text-xs);
  font-weight: 400;
}

/* Čtyři čísla u sebe, ne roztažená přes celou kartu. */
.stats {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: 0.25rem var(--space-2);
  margin: 0;
}

.stats dt {
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.stats dd {
  margin: 0.1rem 0 0;
  font-weight: 600;
}
</style>
