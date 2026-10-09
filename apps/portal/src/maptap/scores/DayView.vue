<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { askConfirm } from '@/components/product/confirm';
import EmptyState from '@/components/product/EmptyState.vue';
import ErrorBlock from '@/components/product/ErrorBlock.vue';
import LoadingBlock from '@/components/product/LoadingBlock.vue';
import { currentLocale, translateMessage } from '@/i18n';
import { useAuthStore } from '@/identity/auth.store';
import RoundBadges from './RoundBadges.vue';
import ScoreSheet from './ScoreSheet.vue';
import { useBoardStore } from './board.store';

/**
 * Pořadí jednoho dne.
 *
 * Úvodní obrazovka: MapTap je denní hra, takže první otázka je „kdo dneska
 * vyhrál“, ne „kdo je nejlepší za celou dobu“. Listuje se jen po dnech, ve
 * kterých se hrálo (doc/wiki/domains/maptapScores.md).
 */
const store = useBoardStore();
const auth = useAuthStore();
const { t } = useI18n();

onMounted(() => store.load());

const sheetOpen = ref(false);

const dayLabel = computed(() => {
  if (store.isToday) return t('maptap.day.today');

  return new Intl.DateTimeFormat(currentLocale.value, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${store.day}T00:00:00.000Z`));
});

async function removeOwn(scoreId: string): Promise<void> {
  const confirmed = await askConfirm({
    title: t('maptap.score.deleteTitle'),
    message: t('maptap.score.confirmDelete'),
    confirmLabel: t('maptap.score.delete'),
    danger: true,
  });
  if (!confirmed) return;

  await store.remove(scoreId);
}
</script>

<template>
  <div>
    <header class="head">
      <div class="day-switch">
        <button
          type="button"
          class="nav"
          :aria-label="t('maptap.day.previous')"
          :disabled="!store.canGoBack"
          @click="store.goToDay(-1)"
        >
          ‹
        </button>
        <h1>{{ dayLabel }}</h1>
        <button
          type="button"
          class="nav"
          :aria-label="t('maptap.day.next')"
          :disabled="!store.canGoForward"
          @click="store.goToDay(1)"
        >
          ›
        </button>
      </div>

      <button v-if="!store.isToday" type="button" class="btn btn-ghost" @click="store.goToToday()">
        {{ t('maptap.day.current') }}
      </button>
    </header>

    <LoadingBlock v-if="store.loading && store.board.scores.length === 0" />
    <ErrorBlock v-else-if="store.error" :message="translateMessage(store.error)" />

    <template v-else>
      <EmptyState
        v-if="store.dayRows.length === 0"
        icon="🗺️"
        :title="t('maptap.empty.title')"
        :description="t('maptap.empty.description')"
      >
        <!-- Hlavní akce patří sem, dokud není co ukázat – ne do rohu obrazovky. -->
        <button v-if="store.isToday" type="button" class="btn btn-primary" @click="sheetOpen = true">
          + {{ t('maptap.score.add') }}
        </button>
      </EmptyState>

      <template v-else>
        <ol class="rows">
          <li
            v-for="row in store.dayRows"
            :key="row.score.id"
            class="row card"
            :class="{ mine: row.score.userId === auth.user?.id }"
          >
            <p class="rank" :class="`rank-${row.rank}`" aria-hidden="true">{{ row.rank }}</p>

            <div class="who">
              <p class="name">
                {{ row.player.name }}
                <span class="visually-hidden">
                  {{ t('maptap.day.rank', { rank: row.rank }) }}
                </span>
              </p>
              <RoundBadges :rounds="row.score.rounds" />
            </div>

            <p class="final score">{{ row.score.finalScore }}</p>

            <button
              v-if="row.score.userId === auth.user?.id"
              type="button"
              class="remove"
              :aria-label="t('maptap.score.delete')"
              @click="removeOwn(row.score.id)"
            >
              ✕
            </button>
          </li>
        </ol>

        <!-- Vkládá se jen k dnešku; starší den už se nedá dohrát. -->
        <p v-if="store.isToday && !store.myScore" class="add">
          <button type="button" class="btn btn-primary" @click="sheetOpen = true">
            + {{ t('maptap.score.add') }}
          </button>
        </p>
      </template>
    </template>

    <ScoreSheet v-model:open="sheetOpen" />
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.day-switch {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.day-switch h1 {
  margin: 0;
  font-size: 1.5rem;
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
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
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
  /* Pořadí, hráč, body a (jen u svého výsledku) křížek – vždy na jednom řádku. */
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 0.35rem var(--space-1);
  align-items: center;
}

/* Vlastní řádek má barevný okraj – na tabuli plné jmen se hledá první. */
.row.mine {
  border-color: var(--color-accent-muted);
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

.who {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.name {
  margin: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.final {
  margin: 0;
  color: var(--color-accent);
  font-size: 1.375rem;
  font-weight: 600;
}

.remove {
  justify-self: end;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.remove:hover {
  background: var(--color-surface-alt);
  color: var(--color-danger);
}

.add {
  margin: var(--space-2) 0 0;
}
</style>
