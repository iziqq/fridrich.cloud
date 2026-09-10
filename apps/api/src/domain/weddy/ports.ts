import type { AgeGroup, GuestSide, GuestStatus, PlanningCategory } from '@fridrich/weddy-shared';
import type { Guest } from './Guest.js';
import type { PlanningItem } from './PlanningItem.js';
import type { Wedding } from './Wedding.js';

export interface GuestFilter {
  side?: GuestSide;
  ageGroup?: AgeGroup;
  status?: GuestStatus;
}

/**
 * Porty modulu weddy. Implementace nad Cosmos DB jsou
 * v `infrastructure/cosmos`.
 */

export interface WeddingRepository {
  findById(weddingId: string): Promise<Wedding | undefined>;
  listForOwner(ownerId: string): Promise<Wedding[]>;
  save(wedding: Wedding): Promise<void>;
  delete(weddingId: string): Promise<void>;
}

export interface GuestRepository {
  findById(weddingId: string, guestId: string): Promise<Guest | undefined>;
  list(weddingId: string, filter?: GuestFilter): Promise<Guest[]>;
  save(guest: Guest): Promise<void>;
  delete(weddingId: string, guestId: string): Promise<void>;
  /** Používá se při mazání celého plánování. */
  deleteAllForWedding(weddingId: string): Promise<void>;
}

export interface PlanningItemRepository {
  findById(weddingId: string, itemId: string): Promise<PlanningItem | undefined>;
  list(weddingId: string, category?: PlanningCategory): Promise<PlanningItem[]>;
  save(item: PlanningItem): Promise<void>;
  delete(weddingId: string, itemId: string): Promise<void>;
  deleteAllForWedding(weddingId: string): Promise<void>;
}
