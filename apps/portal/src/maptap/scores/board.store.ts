import type { MapTapBoard, MapTapScore } from '@fridrich/maptap-shared';
import { dayBoard, playedDays, standings } from '@fridrich/maptap-shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useAuthStore } from '@/identity/auth.store';
import {
  createMapTapScore,
  type CreateMapTapScoreRequest,
} from './endpoints/createMapTapScore.endpoint';
import { deleteMapTapScore } from './endpoints/deleteMapTapScore.endpoint';
import { getMapTapBoard } from './endpoints/getMapTapBoard.endpoint';

/** Dnešek jako `RRRR-MM-DD` podle místního času, ne UTC. */
function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Stav tabule – hráči, výsledky a den, na který se díváme.
 *
 * Načte se všechno najednou a pořadí dne i celkové pořadí se počítají tady
 * stejnými funkcemi jako na backendu. Přepnutí dne i záložky je proto
 * okamžité a čísla se nemají kde rozejít (doc/wiki/domains/maptapScores.md).
 */
export const useBoardStore = defineStore('maptap-board', () => {
  const auth = useAuthStore();

  const board = ref<MapTapBoard>({ players: [], scores: [] });
  const day = ref<string>(today());
  const loading = ref(false);
  const error = ref<string | null>(null);
  const loaded = ref(false);

  /**
   * Dny, mezi kterými se dá listovat: odehrané plus dnešek.
   *
   * Prázdné dny se přeskakují – nikdo nechce proklikat týden, kdy se nehrálo.
   * Dnešek je mezi nimi vždycky, i když ještě nikdo nevložil výsledek:
   * právě tam se totiž vkládá.
   */
  const days = computed(() => {
    const all = new Set([...playedDays(board.value), today()]);
    return [...all].sort((a, b) => b.localeCompare(a));
  });

  const position = computed(() => Math.max(days.value.indexOf(day.value), 0));
  const canGoForward = computed(() => position.value > 0);
  const canGoBack = computed(() => position.value < days.value.length - 1);
  const isToday = computed(() => day.value === today());

  /** Pořadí vybraného dne. */
  const dayRows = computed(() => dayBoard(board.value, day.value));

  /** Celkové pořadí za celou dobu. */
  const table = computed(() => standings(board.value));

  /** Výsledek přihlášeného hráče z vybraného dne – podle něj se nabízí vložení. */
  const myScore = computed<MapTapScore | undefined>(() =>
    board.value.scores.find(
      (score) => score.playedOn === day.value && score.userId === auth.user?.id,
    ),
  );

  function goToDay(delta: number): void {
    const next = days.value[position.value - delta];
    if (next) day.value = next;
  }

  function goToToday(): void {
    day.value = today();
  }

  async function load(force = false): Promise<void> {
    if (!force && loaded.value) return;

    loading.value = true;
    error.value = null;
    try {
      board.value = await getMapTapBoard();
      loaded.value = true;
    } catch (cause) {
      // Klíč hlášky z API – přeloží ho obrazovka (`translateMessage`).
      error.value = (cause as Error).message;
    } finally {
      loading.value = false;
    }
  }

  /** Vloží výsledek a přepne na den, ke kterému ho API přiřadilo. */
  async function add(request: CreateMapTapScoreRequest): Promise<void> {
    const score = await createMapTapScore(request);
    const me = auth.user;
    /*
     * Hráč je v seznamu, jen když už nějaký výsledek má – po tom úplně
     * prvním by se vlastní řádek bez tohohle objevil až po obnovení stránky.
     */
    const players = board.value.players.some((player) => player.id === me?.id)
      ? board.value.players
      : [...board.value.players, { id: score.userId, name: me?.displayName ?? '' }];

    board.value = { players, scores: [...board.value.scores, score] };
    day.value = score.playedOn;
  }

  async function remove(scoreId: string): Promise<void> {
    await deleteMapTapScore(scoreId);
    board.value = {
      ...board.value,
      scores: board.value.scores.filter((score) => score.id !== scoreId),
    };
  }

  return {
    board,
    day,
    days,
    loading,
    error,
    canGoForward,
    canGoBack,
    isToday,
    dayRows,
    table,
    myScore,
    goToDay,
    goToToday,
    load,
    add,
    remove,
  };
});
