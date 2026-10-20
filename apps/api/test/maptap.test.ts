import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { issuesToDetails } from '@fridrich/shared';
import {
  ScoreInputSchema,
  dayBoard,
  latestDay,
  parseScoreText,
  playedDays,
  scoresKeys,
  shiftDay,
  standings,
  yearByPlayer,
  type ScoreInput,
} from '@fridrich/maptap-shared';
import * as v from 'valibot';
import { addScore, eraseUserMapTapData, getBoard } from '../src/application/maptap/scores.js';
import { isDomainError } from '../src/domain/shared/DomainError.js';
import { maptapTestDeps, type MapTapTestContext } from './fakes.js';

const LIBOR = 'user-1';
const EVA = 'user-2';
const TOMAS = 'user-3';

/** Text, jaký MapTap nabízí ke sdílení. */
function paste(day: string, rounds: string, finalScore: number): string {
  return `www.maptap.gg ${day}\n${rounds}\nFinal score: ${finalScore}`;
}

const EXAMPLE = paste(
  'October 9',
  '94:sports_medal: 91:crown: 80:clap: 88:tada: 17:dizzy_face:',
  660,
);

/** Projde text schématem stejně jako endpoint – doména dostává rozebraný vstup. */
function asInput(text: string): ScoreInput {
  return v.parse(ScoreInputSchema, { text });
}

/** Chyby schématu po polích, jak je uvidí formulář. */
function fieldErrors(text: string): Record<string, string> {
  const result = v.safeParse(ScoreInputSchema, { text });
  assert.equal(result.success, false, 'text měl být odmítnut');

  return Object.fromEntries(
    issuesToDetails(result.issues ?? []).map((detail) => [detail.field, detail.message]),
  );
}

describe('vložený výsledek z MapTapu', () => {
  it('rozebere sdílený text na kola a celkový výsledek', () => {
    const parsed = parseScoreText(EXAMPLE);

    assert.equal(parsed.ok, true);
    assert.ok(parsed.ok);
    assert.equal(parsed.score.finalScore, 660, 'celkový výsledek není součet kol');
    assert.deepEqual(
      parsed.score.rounds.map((round) => round.score),
      [94, 91, 80, 88, 17],
    );
    assert.equal(parsed.score.rounds[1]?.badge, 'crown');
  });

  it('každý důvod, proč text nejde přečíst, má vlastní hlášku u pole', () => {
    assert.equal(fieldErrors('94:crown:\nFinal score: 94')['text'], scoresKeys.dateMissing);
    assert.equal(fieldErrors('www.maptap.gg October 9\n94:crown:')['text'], scoresKeys.finalMissing);
    assert.equal(
      fieldErrors('www.maptap.gg October 9\nFinal score: 94')['text'],
      scoresKeys.roundsMissing,
    );
  });

  it('neznámý smajlík výsledek nezahodí', () => {
    const parsed = parseScoreText(paste('October 9', '50:brand_new_emoji: 60🏅', 110));

    assert.ok(parsed.ok);
    assert.deepEqual(
      parsed.score.rounds.map((round) => round.badge),
      ['brand_new_emoji', 'sports_medal'],
    );
  });
});

describe('uložení výsledku', () => {
  it('den bez roku se vztáhne k poslednímu, který už byl', async () => {
    const deps = maptapTestDeps();

    const today = await addScore(deps, asInput(EXAMPLE), LIBOR);
    const christmas = await addScore(
      deps,
      asInput(paste('December 25', '10:crown:', 10)),
      LIBOR,
    );

    assert.equal(today.playedOn, '2026-10-09', 'dnešek je 9. 10. 2026');
    assert.equal(christmas.playedOn, '2025-12-25', 'letošní Vánoce ještě nebyly');
  });

  it('druhý výsledek z téhož dne neprojde', async () => {
    const deps = maptapTestDeps();
    await addScore(deps, asInput(EXAMPLE), LIBOR);

    await assert.rejects(
      () => addScore(deps, asInput(paste('October 9', '99:crown:', 999)), LIBOR),
      (error: unknown) =>
        isDomainError(error) && error.kind === 'conflict' && error.message === scoresKeys.scoreExists,
    );

    const board = await getBoard(deps);
    assert.equal(board.scores.length, 1, 'na tabuli zůstal jen ten první');
  });

  it('jiný hráč smí mít ze stejného dne vlastní výsledek', async () => {
    const deps = maptapTestDeps();
    await addScore(deps, asInput(EXAMPLE), LIBOR);
    await addScore(deps, asInput(paste('October 9', '80:crown:', 500)), EVA);

    assert.equal((await getBoard(deps)).scores.length, 2);
  });

  it('mazání jednoho výsledku neexistuje ani jako use-case', async () => {
    /*
     * Hlídka rozhodnutí, ne chování: tabule ukazuje, co hra dala. Kdyby šel
     * výsledek smazat, dal by se nepovedený den tiše zahodit a součet
     * nejlepších her by přestal něco znamenat. Kdo to sem vrátí, ať u toho
     * projde i zásady ochrany osobních údajů – lhůta se o mazání opírá.
     */
    const useCases = await import('../src/application/maptap/scores.js');

    assert.equal('removeScore' in useCases, false);
    assert.equal('eraseUserMapTapData' in useCases, true, 'rušení účtu výsledky odnést musí');
  });

  it('smazání účtu odnese i výsledky hráče', async () => {
    const deps = maptapTestDeps();
    await addScore(deps, asInput(EXAMPLE), LIBOR);
    await addScore(deps, asInput(paste('October 9', '80:crown:', 500)), EVA);

    await eraseUserMapTapData(deps, { id: LIBOR });

    const board = await getBoard(deps);
    assert.deepEqual(
      board.scores.map((score) => score.userId),
      [EVA],
    );
  });
});

/** Dva hráči a tři dny: Libor 660 a 400, Eva 660 a 700. */
async function withScores(): Promise<MapTapTestContext> {
  const deps = maptapTestDeps();

  await addScore(deps, asInput(EXAMPLE), LIBOR);
  await addScore(deps, asInput(paste('October 9', '80:crown:', 660)), EVA);
  await addScore(deps, asInput(paste('October 8', '40:clap:', 400)), LIBOR);
  await addScore(deps, asInput(paste('October 7', '90:crown:', 700)), EVA);

  return deps;
}

describe('tabule', () => {
  it('den se řadí podle celkového výsledku a remíza drží stejné pořadí', async () => {
    const board = await getBoard(await withScores());
    const day = dayBoard(board, '2026-10-09');

    assert.deepEqual(
      day.map((row) => [row.rank, row.player.name]),
      [
        [1, 'Libor'],
        [1, 'Eva'],
      ],
      'stejný počet bodů znamená stejné pořadí',
    );
  });

  it('dny jdou od nejnovějšího', async () => {
    const board = await getBoard(await withScores());

    assert.deepEqual(playedDays(board), ['2026-10-09', '2026-10-08', '2026-10-07']);
    assert.equal(latestDay(board), '2026-10-09');
  });

  it('hráč bez výsledků se v tabulce neukazuje', async () => {
    const deps = maptapTestDeps();
    await addScore(deps, asInput(EXAMPLE), LIBOR);
    const table = standings(await getBoard(deps));

    assert.deepEqual(
      table.ranked.map((row) => row.player.name),
      ['Libor'],
    );
    assert.deepEqual(table.occasional, []);
  });
});

/**
 * Odehraná sezona tří hráčů.
 *
 * Libor hrál čtyřikrát a jednou mu to nevyšlo, Eva třikrát vyrovnaně, Tomáš
 * jednou a hned nejlíp ze všech. Průměr her na hráče vychází na tři.
 */
async function withSeason(): Promise<MapTapTestContext> {
  const deps = maptapTestDeps();
  const day = (date: string, final: number) => paste(date, `${final}:crown:`, final);

  for (const [date, final] of [
    ['October 9', 500],
    ['October 8', 500],
    ['October 7', 500],
    ['October 6', 100],
  ] as const) {
    await addScore(deps, asInput(day(date, final)), LIBOR);
  }
  for (const [date, final] of [
    ['October 9', 600],
    ['October 8', 450],
    ['October 7', 400],
  ] as const) {
    await addScore(deps, asInput(day(date, final)), EVA);
  }
  await addScore(deps, asInput(day('October 9', 900)), TOMAS);

  return deps;
}

describe('celkové pořadí', () => {
  it('sčítá tolik nejlepších her, kolik jich na hráče v průměru připadá', async () => {
    const table = standings(await getBoard(await withSeason()));

    // Osm her na tři hráče je 2,67 – zaokrouhleno tři.
    assert.equal(table.counted, 3);
  });

  it('řadí součet nejlepších her, ne průměr', async () => {
    const table = standings(await getBoard(await withSeason()));

    assert.deepEqual(
      table.ranked.map((row) => [row.rank, row.player.name, row.score]),
      [
        [1, 'Libor', 1500],
        [2, 'Eva', 1450],
      ],
    );

    const [libor, eva] = table.ranked;
    assert.ok(
      (eva?.average ?? 0) > (libor?.average ?? 0),
      'Eva má lepší průměr, a přesto je druhá – průměr pořadí neurčuje',
    );
  });

  it('nejhorší den se do součtu nepočítá', async () => {
    const table = standings(await getBoard(await withSeason()));
    const libor = table.ranked.find((row) => row.player.name === 'Libor');

    assert.equal(libor?.games, 4);
    assert.equal(libor?.total, 1600, 'dohromady nahrál 1600');
    assert.equal(libor?.score, 1500, 'do pořadí jdou jen tři nejlepší');
  });

  it('kdo tolik her nemá, stojí pod čarou a bez pořadí', async () => {
    const table = standings(await getBoard(await withSeason()));

    assert.deepEqual(
      table.occasional.map((row) => [row.player.name, row.games, row.rank]),
      [['Tomáš', 1, undefined]],
    );
    // A to i když má ze všech nejlepší průměr – z jedné hry se měřit nedá.
    assert.equal(table.occasional[0]?.average, 900);
    assert.ok(table.ranked.every((row) => row.average < 900));
  });

  it('stejný součet znamená stejné pořadí', async () => {
    const deps = maptapTestDeps();
    await addScore(deps, asInput(paste('October 9', '50:crown:', 500)), LIBOR);
    await addScore(deps, asInput(paste('October 9', '50:crown:', 500)), EVA);

    const table = standings(await getBoard(deps));

    assert.equal(table.counted, 1);
    assert.deepEqual(
      table.ranked.map((row) => row.rank),
      [1, 1],
    );
  });
});

describe('pás roku', () => {
  it('má pevnou délku a končí dneškem', async () => {
    const year = yearByPlayer(await getBoard(await withSeason()), '2026-10-09').get(LIBOR) ?? [];

    assert.equal(year.length, 365);
    assert.equal(year.at(-1)?.day, '2026-10-09');
    assert.equal(year[0]?.day, shiftDay('2026-10-09', -364), 'první den je o rok zpátky');
  });

  it('u odehraného dne nese pořadí, body i počet hráčů', async () => {
    const year = yearByPlayer(await getBoard(await withSeason()), '2026-10-09').get(LIBOR) ?? [];
    const today = year.find((entry) => entry.day === '2026-10-09');

    // Toho dne hráli tři a Libor byl s 500 body poslední.
    assert.deepEqual(today, { day: '2026-10-09', players: 3, rank: 3, score: 500 });
  });

  it('den bez vlastního výsledku pořadí nemá, i když ostatní hráli', async () => {
    const board = await getBoard(await withSeason());
    const mine = yearByPlayer(board, '2026-10-09')
      .get(EVA)
      ?.find((entry) => entry.day === '2026-10-06');

    // 6. 10. hrál jen Libor – Eva ten den pořadí nemá, ale je vidět, že se hrálo.
    assert.equal(mine?.rank, undefined);
    assert.equal(mine?.score, undefined);
    assert.equal(mine?.players, 1);
  });

  it('den, kdy se nehrálo, zůstává v pásu prázdný', async () => {
    const year = yearByPlayer(await getBoard(await withSeason()), '2026-10-09').get(LIBOR) ?? [];
    const quiet = year.find((entry) => entry.day === '2026-10-05');

    assert.deepEqual(quiet, { day: '2026-10-05', players: 0 });
  });

  it('pás dostane každý hráč, i ten pod čarou', async () => {
    const years = yearByPlayer(await getBoard(await withSeason()), '2026-10-09');

    assert.deepEqual([...years.keys()].sort(), [LIBOR, EVA, TOMAS].sort());
    assert.ok([...years.values()].every((year) => year.length === 365));
  });

  it('remíza drží stejné pořadí jako denní tabulka', async () => {
    const deps = maptapTestDeps();
    await addScore(deps, asInput(paste('October 9', '50:crown:', 500)), LIBOR);
    await addScore(deps, asInput(paste('October 9', '50:crown:', 500)), EVA);

    const board = await getBoard(deps);
    const day = yearByPlayer(board, '2026-10-09').get(EVA)?.at(-1);

    assert.equal(day?.rank, 1, 'stejné body znamenají stejné pořadí');
    assert.equal(day?.players, 2);
  });
});
