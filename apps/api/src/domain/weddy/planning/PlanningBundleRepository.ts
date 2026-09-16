import type { PlanningBundle } from './PlanningBundle.js';

/** Port pro ukládání balíčků. Implementace nad Cosmos DB je v `infrastructure/cosmos`. */
export interface PlanningBundleRepository {
  findById(weddingId: string, bundleId: string): Promise<PlanningBundle | undefined>;
  list(weddingId: string): Promise<PlanningBundle[]>;
  save(bundle: PlanningBundle): Promise<void>;
  delete(weddingId: string, bundleId: string): Promise<void>;
  deleteAllForWedding(weddingId: string): Promise<void>;
}
