import * as v from 'valibot';
import { MapTapScoreSchema, shiftDay, type MapTapScore } from './scores.js';

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
  /**
   * Pořadí od jedné. Hráči pod čarou ho nemají – měřítko je postavené na
   * `counted` hrách a tolik jich zatím neodehráli.
   */
  rank?: number;
  /** Součet `counted` nejlepších výsledků. Podle něj se řadí. */
  score: number;
  games: number;
  /** Průměr celkových výsledků, zaokrouhlený na desetinu. */
  average: number;
  best: number;
  total: number;
  /** Dny, ve kterých měl hráč nejvyšší výsledek; při remíze vyhrají oba. */
  wins: number;
}

export interface Standings {
  /** Kolik nejlepších her se sčítá – průměrný počet her na hráče. */
  counted: number;
  /** Hráči s aspoň `counted` hrami, seřazení podle součtu. */
  ranked: Standing[];
  /** Hráči, kteří tolik her nemají – pod čarou a bez pořadí. */
  occasional: Standing[];
}

/**
 * Celkové pořadí podle **součtu `counted` nejlepších her**.
 *
 * Každý se měří na stejném počtu her, takže jeden vydařený den nikoho
 * nevynese – na rozdíl od průměru, kterým se pořadí řídilo dřív a kde stačilo
 * zahrát si jednou a dobře. Měřítko si přitom nevymýšlíme: `counted` je
 * průměrný počet her na hráče, takže roste s tím, kolik se tu hraje.
 *
 * Kdo tolik her ještě nemá, do pořadí nepatří: jeho součet je z podstaty
 * kratší a mezi ostatními by vypadal jako slabý výkon, i kdyby hrál nejlíp ze
 * všech. Takoví hráči proto stojí zvlášť pod čarou
 * (doc/wiki/domains/maptapScores.md).
 */
export function standings(board: MapTapBoard): Standings {
  const winners = new Map<string, Set<string>>();
  for (const day of playedDays(board)) {
    const entries = dayBoard(board, day);
    for (const entry of entries.filter((row) => row.rank === 1)) {
      const days = winners.get(entry.player.id) ?? new Set<string>();
      days.add(day);
      winners.set(entry.player.id, days);
    }
  }

  /* Výsledky každého hráče od nejlepšího – součet nejlepších je pak jen začátek seznamu. */
  const played = board.players
    .map((player) => ({
      player,
      finals: board.scores
        .filter((score) => score.userId === player.id)
        .map((score) => score.finalScore)
        .sort((a, b) => b - a),
    }))
    .filter((row) => row.finals.length > 0);

  if (played.length === 0) return { counted: 0, ranked: [], occasional: [] };

  const games = played.reduce((sum, row) => sum + row.finals.length, 0);
  const counted = Math.max(1, Math.round(games / played.length));

  const rows: Standing[] = played.map(({ player, finals }) => {
    const total = finals.reduce((sum, final) => sum + final, 0);

    return {
      player,
      score: finals.slice(0, counted).reduce((sum, final) => sum + final, 0),
      games: finals.length,
      average: Math.round((total / finals.length) * 10) / 10,
      best: finals[0] ?? 0,
      total,
      wins: winners.get(player.id)?.size ?? 0,
    };
  });

  const byScore = (a: Standing, b: Standing): number =>
    b.score - a.score || b.games - a.games || a.player.name.localeCompare(b.player.name);

  return {
    counted,
    ranked: withRanks(rows.filter((row) => row.games >= counted).sort(byScore)),
    occasional: rows.filter((row) => row.games < counted).sort(byScore),
  };
}

/** Stejný součet znamená stejné pořadí a další číslo se o remízu posune (1, 1, 3). */
function withRanks(rows: Standing[]): Standing[] {
  let rank = 0;
  let previous: number | undefined;

  return rows.map((row, index) => {
    if (row.score !== previous) {
      rank = index + 1;
      previous = row.score;
    }
    return { ...row, rank };
  });
}

/* --- Rok hráče --- */

/** Kolik dní má pás v přehledu. */
export const YEAR_DAYS = 365;

/** Jeden čtvereček v pásu – jeden den očima jednoho hráče. */
export interface YearDay {
  day: string;
  /** Pořadí hráče toho dne; chybí, když ten den nehrál. */
  rank?: number;
  /** Jeho celkový výsledek toho dne. */
  score?: number;
  /** Kolik lidí ten den hrálo. Samotné pořadí nic neříká – první ze dvou není jako první z pěti. */
  players: number;
}

/**
 * Posledních `days` dní pro **každého hráče**, od nejstaršího k dnešku.
 *
 * Vrací **každý den**, i ten, kdy se nehrálo – pás má mít pevnou délku, aby
 * se dal nakreslit do mřížky po týdnech a mezery v něm byly vidět.
 *
 * Počítá se to pro všechny najednou schválně: tabule kreslí pás u každého
 * hráče a volat výpočet zvlášť pro každého by znamenalo projít všechny
 * výsledky tolikrát, kolik je hráčů. Takhle se projdou jednou.
 *
 * Pořadí si funkce nepočítá po svém, ptá se `dayBoard` – jinak by se
 * pravidlo o remízách časem rozešlo se zbytkem tabule.
 */
export function yearByPlayer(
  board: MapTapBoard,
  today: string,
  days = YEAR_DAYS,
): Map<string, YearDay[]> {
  const years = new Map<string, YearDay[]>(board.players.map((player) => [player.id, []]));

  for (let back = days - 1; back >= 0; back -= 1) {
    const day = shiftDay(today, -back);
    const entries = dayBoard(board, day);

    for (const [id, year] of years) {
      const mine = entries.find((entry) => entry.player.id === id);

      year.push({
        day,
        players: entries.length,
        ...(mine ? { rank: mine.rank, score: mine.score.finalScore } : {}),
      });
    }
  }

  return years;
}
