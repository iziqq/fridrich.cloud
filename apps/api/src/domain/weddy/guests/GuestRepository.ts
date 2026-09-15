import type { AgeGroup, GuestSide, GuestStatus } from '@fridrich/weddy-shared';
import type { Guest } from './Guest.js';

export interface GuestFilter {
  side?: GuestSide;
  ageGroup?: AgeGroup;
  status?: GuestStatus;
}

/** Port pro ukládání hostů. Implementace nad Cosmos DB je v `infrastructure/cosmos`. */
export interface GuestRepository {
  findById(weddingId: string, guestId: string): Promise<Guest | undefined>;
  list(weddingId: string, filter?: GuestFilter): Promise<Guest[]>;
  save(guest: Guest): Promise<void>;
  delete(weddingId: string, guestId: string): Promise<void>;
  /** Používá se při mazání celého plánování. */
  deleteAllForWedding(weddingId: string): Promise<void>;
}
