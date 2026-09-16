import type { WeddingInvitation } from './WeddingInvitation.js';

/** Port pro pozvánky do plánování. Implementace nad Cosmos DB je v `infrastructure/cosmos`. */
export interface WeddingInvitationRepository {
  listForWedding(weddingId: string): Promise<WeddingInvitation[]>;
  /** Pozvánky čekající na jeden e-mail – používá se po registraci účtu. */
  listForEmail(email: string): Promise<WeddingInvitation[]>;
  findById(weddingId: string, invitationId: string): Promise<WeddingInvitation | undefined>;
  save(invitation: WeddingInvitation): Promise<void>;
  delete(weddingId: string, invitationId: string): Promise<void>;
  deleteAllForWedding(weddingId: string): Promise<void>;
}
