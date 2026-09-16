/**
 * Port do domény identity – jen na jméno a e-mail k už známému účtu.
 *
 * Domény se navzájem nevolají: weddy si řekne, co potřebuje pro obrazovku
 * přístupů, a implementaci nad repozitářem uživatelů dodá `container.ts`
 * (CLAUDE.md, pravidlo 3).
 */
export interface DirectoryUser {
  id: string;
  email: string;
  displayName: string;
}

export interface UserDirectory {
  findByEmail(email: string): Promise<DirectoryUser | undefined>;
  findByIds(ids: readonly string[]): Promise<DirectoryUser[]>;
}
