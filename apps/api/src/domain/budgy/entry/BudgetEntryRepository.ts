import type { BudgetEntry } from './BudgetEntry.js';

/** Port pro ukládání položek rozpočtu. Implementace nad Cosmos DB je v `infrastructure/cosmos`. */
export interface BudgetEntryRepository {
  findById(userId: string, entryId: string): Promise<BudgetEntry | undefined>;
  listForUser(userId: string): Promise<BudgetEntry[]>;
  save(entry: BudgetEntry): Promise<void>;
  delete(userId: string, entryId: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
  /**
   * Zápisy z jiné aplikace, jejichž odkaz začíná `refPrefix`.
   *
   * Hledá se napříč účty: platba se zapisuje správci plánování, a ten se
   * mezitím mohl změnit – zápis ale zůstal u toho, komu byl zapsán.
   */
  listBySourceRef(refPrefix: string): Promise<BudgetEntry[]>;
}
