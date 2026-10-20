import type { MapTapBoard, MapTapScore as ScoreData, ScoreInput } from '@fridrich/maptap-shared';
import { scoresKeys } from '@fridrich/maptap-shared';
import { DomainError } from '../../domain/shared/DomainError.js';
import { MapTapScore } from '../../domain/maptap/score/MapTapScore.js';
import type { MapTapDeps } from './deps.js';

/*
 * Use-casy subdomény `scores`.
 *
 * Tabule je společná – výsledky vidí každý přihlášený hráč. Zapisovat a mazat
 * ale smí každý jen své: cizí výsledek se tváří, že neexistuje, aby nešlo
 * zkoušením odhalit, co v databázi je.
 */

/**
 * Celá tabule: hráči a jejich výsledky.
 *
 * Posílá se surový seznam a pořadí si dopočítá obrazovka stejnou funkcí ze
 * sdíleného jádra (`dayBoard`, `standings`). Jména se dotahují jedním
 * dotazem přes port – doména maptap do uživatelů sama nevidí.
 */
export async function getBoard(deps: MapTapDeps): Promise<MapTapBoard> {
  const scores = await deps.scores.listAll();
  const playerIds = [...new Set(scores.map((score) => score.userId))];
  const players = await deps.players.findByIds(playerIds);

  const known = new Set(players.map((player) => player.id));

  return {
    players: players.map((player) => ({ id: player.id, name: player.displayName })),
    /* Výsledek bez účtu (smazaný mezi dotazy) by byl řádek bez jména. */
    scores: scores.filter((score) => known.has(score.userId)).map((score) => score.toState()),
  };
}

/**
 * Vložení výsledku.
 *
 * Jeden hráč má za den jeden výsledek – jinak by stačilo hrát na víc
 * zařízení a nasypat na tabuli ten nejlepší pokus. Opravit se dá smazáním
 * a vložením znovu.
 */
export async function addScore(
  deps: MapTapDeps,
  input: ScoreInput,
  userId: string,
): Promise<ScoreData> {
  const score = MapTapScore.create({
    id: deps.ids.next(),
    userId,
    score: input,
    clock: deps.clock,
  });

  /* Den určuje doména (text z MapTapu rok neobsahuje), takže se ptáme až po ní. */
  const existing = await deps.scores.findForDay(userId, score.playedOn);
  if (existing) throw DomainError.conflict(scoresKeys.scoreExists);

  await deps.scores.save(score);
  return score.toState();
}

/**
 * Smazání účtu – port `UserDataEraser` (CLAUDE.md, pravidlo 27).
 *
 * Z tabule zmizí i historie hráče, včetně vyhraných dnů. Je to správně:
 * tabule je jen součet výsledků, a ty jsou jeho.
 */
export async function eraseUserMapTapData(
  deps: MapTapDeps,
  user: { id: string },
): Promise<void> {
  await deps.scores.deleteAllForUser(user.id);
}
