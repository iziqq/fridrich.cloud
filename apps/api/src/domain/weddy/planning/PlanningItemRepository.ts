import type { PlanningCategory } from '@fridrich/weddy-shared';
import type { PlanningItem } from './PlanningItem.js';

/** Port pro ukládání položek plánování. Implementace nad Cosmos DB je v `infrastructure/cosmos`. */
export interface PlanningItemRepository {
  findById(weddingId: string, itemId: string): Promise<PlanningItem | undefined>;
  list(weddingId: string, category?: PlanningCategory): Promise<PlanningItem[]>;
  save(item: PlanningItem): Promise<void>;
  delete(weddingId: string, itemId: string): Promise<void>;
  deleteAllForWedding(weddingId: string): Promise<void>;
}
