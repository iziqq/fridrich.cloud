<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import EmptyState from '@/components/product/EmptyState.vue';
import ErrorBlock from '@/components/product/ErrorBlock.vue';
import LoadingBlock from '@/components/product/LoadingBlock.vue';
import { currentLocale, translateMessage } from '@/i18n';
import { useAuthStore } from '@/identity/auth.store';
import { useBoardStore } from './board.store';

/**
 * Celkové pořadí.
 *
 * Řadí **průměr**, ne součet – jinak by vedl ten, kdo hraje nejdéle, a nový
 * hráč by neměl co dohánět. Počet her a vyhrané dny jsou vedle, takže je
 * vidět, z kolika her průměr je (doc/wiki/domains/maptapScores.md).
 *
 * Tabulka se na mobilu nekreslí jako tabulka: pět sloupců se na 360 px
 * nevejde, takže je z každého hráče karta (CLAUDE.md, pravidlo 24).
 */
const store = useBoardStore();
const auth = useAuthStore();
const { t } = useI18n();

onMounted(() => store.load());

function number(value: number): string {
  return new Intl.NumberFormat(currentLocale.value, { maximumFractionDigits: 1 }).format(value);
}
</script>

<template>
  <div>
    <header class="head">
      <h1>{{ t('maptap.standings.title') }}</h1>
      <p class="hint">{{ t('maptap.standings.hint') }}</p>
    </header>

    <LoadingBlock v-if="store.loading && store.board.scores.length === 0" />
    <ErrorBlock v-else-if="store.error" :message="translateMessage(store.error)" />

    <EmptyState
      v-else-if="store.table.length === 0"
      icon="🏅"
      :title="t('maptap.standings.emptyTitle')"
      :description="t('maptap.standings.emptyDescription')"
    />

    <ol v-else class="rows">
      <li
        v-for="row in store.table"
        :key="row.player.id"
        class="row card"
        :class="{ mine: row.player.id === auth.user?.id }"
      >
        <div class="who">
          <p class="rank" :class="`rank-${row.rank}`" aria-hidden="true">{{ row.rank }}</p>
          <p class="name">
            {{ row.player.name }}
            <span class="visually-hidden">{{ t('maptap.day.rank', { rank: row.rank }) }}</span>
          </p>
          <p class="average">
            <span class="score">{{ number(row.average) }}</span>
            <!-- Co to velké číslo je: podle něj se řadí, takže nesmí být hádanka. -->
            <span class="unit">{{ t('maptap.standings.average') }}</span>
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
            <dt>{{ t('maptap.standings.total') }}</dt>
            <dd class="score">{{ number(row.total) }}</dd>
          </div>
        </dl>
      </li>
    </ol>
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

.rows {
  display: grid;
  gap: var(--space-1);
  /*
   * Na širokém okně se řádek nesmí roztáhnout přes celou obrazovku – jméno
   * vlevo a výsledek u pravého okraje by se četly jako dvě různé věci.
   */
  max-width: 46rem;
}

.row {
  display: grid;
  gap: var(--space-1);
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
  overflow-wrap: anywhere;
}

.average {
  display: grid;
  justify-items: end;
  margin: 0;
  color: var(--color-accent);
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.1;
}

.average .unit {
  color: var(--color-muted);
  font-size: var(--text-xs);
  font-weight: 400;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.25rem var(--space-1);
  margin: 0;
  padding-top: var(--space-1);
  border-top: 1px solid var(--color-border);
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
