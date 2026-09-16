import type { BudgetEntry } from './BudgetEntry.js';

/** Port pro ukládání položek rozpočtu. Implementace nad Cosmos DB je v `infrastructure/cosmos`. */
export interface BudgetEntryRepository {
  findById(userId: string, entryId: string): Promise<BudgetEntry | undefined>;
  listForUser(userId: string): Promise<BudgetEntry[]>;
  save(entry: BudgetEntry): Promise<void>;
  delete(userId: string, entryId: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
