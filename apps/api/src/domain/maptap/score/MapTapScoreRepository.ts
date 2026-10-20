import type { MapTapScore } from './MapTapScore.js';

/** Port pro ukládání výsledků. Implementace nad Cosmos DB je v `infrastructure/cosmos`. */
export interface MapTapScoreRepository {
  /** Výsledek hráče z daného dne – podle něj se pozná druhé vložení téhož dne. */
  findForDay(userId: string, playedOn: string): Promise<MapTapScore | undefined>;
  /**
   * Všechny výsledky všech hráčů.
   *
   * Tabule je společná, takže se čte celá. Hraje pár lidí jednou denně –
   * je to pár set dokumentů ročně a stránkovat by bylo dražší než číst
   * (doc/wiki/domains/maptapScores.md).
   */
  listAll(): Promise<MapTapScore[]>;
  save(score: MapTapScore): Promise<void>;
  /** Jen při rušení účtu – jednotlivý výsledek z tabule zmizet nemůže. */
  deleteAllForUser(userId: string): Promise<void>;
}
