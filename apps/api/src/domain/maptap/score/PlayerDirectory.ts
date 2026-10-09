/**
 * Port do domény identity – jen na jméno hráče, kterého už známe podle `id`.
 *
 * Domény se navzájem nevolají: MapTap si řekne o to jediné, co na tabuli
 * potřebuje, a implementaci nad repozitářem uživatelů dodá `container.ts`
 * (CLAUDE.md, pravidlo 3). E-mail tenhle port schválně nevrací – na tabuli
 * by neměl co dělat a co se nepošle, to nemůže uniknout.
 */
export interface MapTapPlayer {
  id: string;
  displayName: string;
}

export interface PlayerDirectory {
  findByIds(ids: readonly string[]): Promise<MapTapPlayer[]>;
}
