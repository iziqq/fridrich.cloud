import type { Wedding } from './Wedding.js';

/** Port pro ukládání svateb. Implementace nad Cosmos DB je v `infrastructure/cosmos`. */
export interface WeddingRepository {
  findById(weddingId: string): Promise<Wedding | undefined>;
  listForMember(userId: string): Promise<Wedding[]>;
  save(wedding: Wedding): Promise<void>;
  delete(weddingId: string): Promise<void>;
}
