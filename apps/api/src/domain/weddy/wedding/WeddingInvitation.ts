import { WEDDING_INVITATION_RETENTION_DAYS } from '@fridrich/shared';
import type { InvitableRole, WeddingInvitation as WeddingInvitationData } from '@fridrich/weddy-shared';
import type { Clock } from '../../shared/Clock.js';

export interface WeddingInvitationState {
  id: string;
  weddingId: string;
  /** E-mail pozvaného, malými písmeny – účet k němu zatím nepatří. */
  email: string;
  role: InvitableRole;
  invitedAt: string;
  expiresAt: string;
}

/**
 * Pozvánka do plánování pro e-mail, ke kterému ještě nepatří účet.
 *
 * Jakmile se k adrese někdo zaregistruje, pozvánka se promění v členství
 * (`claimWeddingInvitations`) a zanikne. Nepřijatou uklidí databáze sama
 * po `WEDDING_INVITATION_RETENTION_DAYS` – e-mail cizího člověka nemá ležet
 * v databázi déle, než je k čemu (doc/wiki/architecture/personalData.md).
 */
export class WeddingInvitation {
  private constructor(private readonly state: WeddingInvitationState) {}

  static issue(input: {
    id: string;
    weddingId: string;
    email: string;
    role: InvitableRole;
    clock: Clock;
  }): WeddingInvitation {
    const now = input.clock.now();
    const expiresAt = new Date(
      now.getTime() + WEDDING_INVITATION_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    return new WeddingInvitation({
      id: input.id,
      weddingId: input.weddingId,
      email: input.email,
      role: input.role,
      invitedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  }

  static fromState(state: WeddingInvitationState): WeddingInvitation {
    return new WeddingInvitation(state);
  }

  get id(): string {
    return this.state.id;
  }

  get weddingId(): string {
    return this.state.weddingId;
  }

  get email(): string {
    return this.state.email;
  }

  get role(): InvitableRole {
    return this.state.role;
  }

  isExpired(clock: Clock): boolean {
    return clock.now().getTime() >= new Date(this.state.expiresAt).getTime();
  }

  toState(): WeddingInvitationState {
    return { ...this.state };
  }

  /** Tvar pro frontend – bez `weddingId`, ten zná volající z cesty. */
  toPublic(): WeddingInvitationData {
    const { weddingId: _weddingId, ...rest } = this.state;
    return rest;
  }
}
