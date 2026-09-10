import type { Clock } from '../shared/Clock.js';
import { DomainError } from '../shared/DomainError.js';

export type TokenPurpose = 'emailVerification' | 'passwordReset';

/** Doby platnosti podle doc/architecture.md, kap. 5. */
export const TOKEN_LIFETIME_MS: Record<TokenPurpose, number> = {
  emailVerification: 24 * 60 * 60 * 1000, // 24 hodin
  passwordReset: 60 * 60 * 1000, // 1 hodina
};

export interface OneTimeTokenState {
  id: string;
  /** SHA-256 otisk tokenu. Samotný token v databázi nikdy neleží. */
  tokenHash: string;
  userId: string;
  purpose: TokenPurpose;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

/**
 * Jednorázový token pro ověření e-mailu a obnovu hesla.
 *
 * V databázi je jen otisk – kdo by získal přístup k datům, nedokáže z něj
 * odvodit odkaz, který uživateli přišel e-mailem.
 */
export class OneTimeToken {
  private constructor(
    readonly id: string,
    readonly tokenHash: string,
    readonly userId: string,
    readonly purpose: TokenPurpose,
    readonly expiresAt: string,
    private usedAtValue: string | undefined,
    readonly createdAt: string,
  ) {}

  static issue(input: {
    id: string;
    tokenHash: string;
    userId: string;
    purpose: TokenPurpose;
    clock: Clock;
  }): OneTimeToken {
    const now = input.clock.now();
    const expiresAt = new Date(now.getTime() + TOKEN_LIFETIME_MS[input.purpose]);

    return new OneTimeToken(
      input.id,
      input.tokenHash,
      input.userId,
      input.purpose,
      expiresAt.toISOString(),
      undefined,
      now.toISOString(),
    );
  }

  static fromState(state: OneTimeTokenState): OneTimeToken {
    return new OneTimeToken(
      state.id,
      state.tokenHash,
      state.userId,
      state.purpose,
      state.expiresAt,
      state.usedAt,
      state.createdAt,
    );
  }

  get usedAt(): string | undefined {
    return this.usedAtValue;
  }

  isExpired(clock: Clock): boolean {
    return clock.now().getTime() >= new Date(this.expiresAt).getTime();
  }

  isUsed(): boolean {
    return this.usedAtValue !== undefined;
  }

  /**
   * Spotřebuje token. Chybová hláška je schválně stejná pro expirovaný,
   * použitý i špatný token – ať se z ní nedá nic odvodit.
   */
  consume(purpose: TokenPurpose, clock: Clock): void {
    if (this.purpose !== purpose || this.isUsed() || this.isExpired(clock)) {
      throw DomainError.field('token', 'Odkaz už není platný. Vyžádejte si nový.');
    }

    this.usedAtValue = clock.now().toISOString();
  }

  toState(): OneTimeTokenState {
    const state: OneTimeTokenState = {
      id: this.id,
      tokenHash: this.tokenHash,
      userId: this.userId,
      purpose: this.purpose,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
    };

    if (this.usedAtValue) state.usedAt = this.usedAtValue;
    return state;
  }
}
