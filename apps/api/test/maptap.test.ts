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
  standings,
  type ScoreInput,
} from '@fridrich/maptap-shared';
import * as v from 'valibot';
import {
  addScore,
  eraseUserMapTapData,
  getBoard,
  removeScore,
} from '../src/application/maptap/scores.js';
import { isDomainError } from '../src/domain/shared/DomainError.js';
import { maptapTestDeps, type MapTapTestContext } from './fakes.js';

const LIBOR = 'user-1';
const EVA = 'user-2';

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

  it('cizí výsledek smazat nejde a tváří se, že není', async () => {
    const deps = maptapTestDeps();
    const score = await addScore(deps, asInput(EXAMPLE), LIBOR);

    await assert.rejects(
      () => removeScore(deps, score.id, EVA),
      (error: unknown) => isDomainError(error) && error.kind === 'notFound',
    );
    assert.equal((await getBoard(deps)).scores.length, 1);

    await removeScore(deps, score.id, LIBOR);
    assert.equal((await getBoard(deps)).scores.length, 0, 'svůj smazat jde');
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

  it('celkové pořadí vede průměr, ne nahrané hodiny', async () => {
    const board = await getBoard(await withScores());
    const table = standings(board);

    assert.deepEqual(
      table.map((row) => [row.rank, row.player.name, row.average, row.games, row.wins]),
      [
        // Eva má míň her, ale lepší průměr – a vyhrála dva dny (9. 10. remízou).
        [1, 'Eva', 680, 2, 2],
        [2, 'Libor', 530, 2, 2],
      ],
    );
    assert.equal(table[0]?.best, 700);
    assert.equal(table[1]?.total, 1060);
  });

  it('hráč bez výsledků se v tabulce neukazuje', async () => {
    const deps = maptapTestDeps();
    await addScore(deps, asInput(EXAMPLE), LIBOR);

    assert.deepEqual(
      standings(await getBoard(deps)).map((row) => row.player.name),
      ['Libor'],
    );
  });
});
