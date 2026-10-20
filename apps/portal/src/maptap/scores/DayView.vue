<script setup lang="ts">
import { parseScoreText } from '@fridrich/maptap-shared';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ApiError } from '@/api/http';
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
const sheetText = ref('');
const sheetNotice = ref('');
const pasting = ref(false);
const pasteError = ref<string | null>(null);

const dayLabel = computed(() => {
  if (store.isToday) return t('maptap.day.today');

  return new Intl.DateTimeFormat(currentLocale.value, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${store.day}T00:00:00.000Z`));
});

function openSheet(text: string, notice: string): void {
  sheetText.value = text;
  sheetNotice.value = notice;
  sheetOpen.value = true;
}

/** Schránka bez vyhazování výjimek – zakázané čtení se chová jako prázdná. */
async function clipboardText(): Promise<string | undefined> {
  try {
    return await navigator.clipboard?.readText();
  } catch {
    // Prohlížeč čtení nepovolil; proč, se nedozvíme a ani to nepotřebujeme.
    return undefined;
  }
}

/**
 * Vložení výsledku jedním ťuknutím.
 *
 * Text se vezme rovnou ze schránky a hned uloží – hráč ho tam má z hry, takže
 * přepisovat ho do formuláře a pak mačkat Uložit byly dva kroky navíc. Číst
 * schránku smíme jen po kliknutí a jen v zabezpečeném kontextu, nikdy sama od
 * sebe; proto to visí na tlačítku (doc/wiki/domains/maptapScores.md).
 *
 * Když to nevyjde, otevře se ruční formulář – jinak by hráč v prohlížeči,
 * který ke schránce nepustí, neměl výsledek jak zadat. Odmítnutí od API je
 * jiný případ: text byl v pořádku, takže formulář nepomůže a stačí hláška.
 */
async function pasteResult(): Promise<void> {
  pasting.value = true;
  pasteError.value = null;

  try {
    const text = await clipboardText();
    if (text === undefined) return openSheet('', t('maptap.form.clipboardBlocked'));
    if (!parseScoreText(text).ok) return openSheet(text, '');

    await store.add({ text });
  } catch (cause) {
    pasteError.value =
      cause instanceof ApiError
        ? (cause.details[0]?.message ?? cause.message)
        : 'maptap.form.saveFailed';
  } finally {
    pasting.value = false;
  }
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
        <button
          v-if="store.isToday"
          type="button"
          class="btn btn-primary"
          :disabled="pasting"
          @click="pasteResult()"
        >
          {{ pasting ? t('maptap.score.pasting') : t('maptap.score.paste') }}
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
          </li>
        </ol>

        <!-- Vkládá se jen k dnešku; starší den už se nedá dohrát. -->
        <p v-if="store.isToday && !store.myScore" class="add">
          <button type="button" class="btn btn-primary" :disabled="pasting" @click="pasteResult()">
            {{ pasting ? t('maptap.score.pasting') : t('maptap.score.paste') }}
          </button>
        </p>
      </template>
    </template>

    <!-- Hláška od API: text ze schránky byl v pořádku, jen ho server odmítl. -->
    <p v-if="pasteError" class="paste-error" role="alert">{{ translateMessage(pasteError) }}</p>

    <ScoreSheet v-model:open="sheetOpen" :initial-text="sheetText" :notice="sheetNotice" />
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
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.35rem var(--space-2);
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

.add {
  margin: var(--space-2) 0 0;
}

.paste-error {
  margin: var(--space-2) 0 0;
  color: var(--color-danger);
  font-size: var(--text-sm);
}
</style>
