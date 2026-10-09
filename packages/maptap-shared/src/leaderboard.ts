import * as v from 'valibot';
import { MapTapScoreSchema, type MapTapScore } from './scores.js';

/*
 * Subdoména `leaderboard` – pořadí hráčů.
 *
 * Nic se neukládá: tabulka je vždy dopočítaná z výsledků, stejně jako měsíc
 * v IziBudgy nebo rozpočet v IziWeddy. API proto posílá jen seznam hráčů a
 * jejich výsledky a obrazovka si z nich poskládá den i celkové pořadí –
 * výpočet je jeden a nemá se kde rozejít.
 */

export const BoardPlayerSchema = v.object({
  id: v.string(),
  /** Jméno z účtu. E-mail se na tabuli vědomě neposílá – stačí jméno. */
  name: v.string(),
});
export type BoardPlayer = v.InferOutput<typeof BoardPlayerSchema>;

export const MapTapBoardSchema = v.object({
  players: v.array(BoardPlayerSchema),
  scores: v.array(MapTapScoreSchema),
});
export type MapTapBoard = v.InferOutput<typeof MapTapBoardSchema>;

/** Jeden řádek denní tabulky. */
export interface DayEntry {
  /** Pořadí od jedné; stejný počet bodů znamená stejné pořadí. */
  rank: number;
  player: BoardPlayer;
  score: MapTapScore;
}

function playerMap(board: MapTapBoard): Map<string, BoardPlayer> {
  return new Map(board.players.map((player) => [player.id, player]));
}

/** Dny, ve kterých někdo hrál – od nejnovějšího. */
export function playedDays(board: MapTapBoard): string[] {
  const days = new Set(board.scores.map((score) => score.playedOn));
  return [...days].sort((a, b) => b.localeCompare(a));
}

/** Poslední den, ve kterém někdo hrál. */
export function latestDay(board: MapTapBoard): string | undefined {
  return playedDays(board)[0];
}

/**
 * Pořadí jednoho dne – od nejvyššího celkového výsledku.
 *
 * Při shodě bodů dostanou hráči stejné pořadí a další číslo se o ně posune
 * (1, 1, 3): remízu nemá smysl rozsekávat tím, kdo výsledek vložil dřív.
 */
export function dayBoard(board: MapTapBoard, day: string): DayEntry[] {
  const players = playerMap(board);
  const entries: DayEntry[] = [];
  let rank = 0;
  let previous: number | undefined;

  const scores = board.scores
    .filter((score) => score.playedOn === day)
    .sort((a, b) => b.finalScore - a.finalScore);

  for (const [index, score] of scores.entries()) {
    const player = players.get(score.userId);
    /* Výsledek bez hráče (smazaný účet) na tabuli nepatří. */
    if (!player) continue;

    if (score.finalScore !== previous) {
      rank = index + 1;
      previous = score.finalScore;
    }

    entries.push({ rank, player, score });
  }

  return entries;
}

/** Jeden řádek celkového pořadí. */
export interface Standing {
  player: BoardPlayer;
  rank: number;
  games: number;
  /** Průměr celkových výsledků, zaokrouhlený na desetinu. */
  average: number;
  best: number;
  total: number;
  /** Dny, ve kterých měl hráč nejvyšší výsledek; při remíze vyhrají oba. */
  wins: number;
}

/**
 * Celkové pořadí podle **průměru**, ne podle součtu.
 *
 * Součet by byl jen žebříček pilnosti – kdo hraje déle, ten vede, a nově
 * příchozí nemá šanci dohnat nic jiného než čas. Průměr srovnává výkon;
 * počet her a vyhrané dny jsou vedle v tabulce, takže je vidět, z kolika
 * her průměr je.
 */
export function standings(board: MapTapBoard): Standing[] {
  const winners = new Map<string, Set<string>>();
  for (const day of playedDays(board)) {
    const entries = dayBoard(board, day);
    for (const entry of entries.filter((row) => row.rank === 1)) {
      const days = winners.get(entry.player.id) ?? new Set<string>();
      days.add(day);
      winners.set(entry.player.id, days);
    }
  }

  const rows = board.players
    .map((player) => {
      const scores = board.scores.filter((score) => score.userId === player.id);
      const total = scores.reduce((sum, score) => sum + score.finalScore, 0);

      return {
        player,
        rank: 0,
        games: scores.length,
        average: scores.length === 0 ? 0 : Math.round((total / scores.length) * 10) / 10,
        best: scores.reduce((best, score) => Math.max(best, score.finalScore), 0),
        total,
        wins: winners.get(player.id)?.size ?? 0,
      };
    })
    .filter((row) => row.games > 0)
    .sort((a, b) => b.average - a.average || b.games - a.games || a.player.name.localeCompare(b.player.name));

  let rank = 0;
  let previous: number | undefined;
  return rows.map((row, index) => {
    if (row.average !== previous) {
      rank = index + 1;
      previous = row.average;
    }
    return { ...row, rank };
  });
}
