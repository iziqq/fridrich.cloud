import type { Clock } from '../shared/Clock.js';
import { DomainError } from '../shared/DomainError.js';

/** Doba platnosti ověřovacího odkazu (doc/wiki/domains/identity.md). */
export const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hodin

export interface OneTimeTokenState {
  id: string;
  /** SHA-256 otisk tokenu. Samotný token v databázi nikdy neleží. */
  tokenHash: string;
  userId: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

/**
 * Jednorázový token z ověřovacího odkazu, který chodí po registraci.
 *
 * V databázi je jen otisk – kdo by získal přístup k datům, nedokáže z něj
 * odvodit odkaz, který uživateli přišel e-mailem. Na rozdíl od
 * [`LoginCode`](./LoginCode.ts) je dost dlouhý na to, aby se nedal uhodnout,
 * takže si vystačí s expirací a jednorázovostí.
 */
export class OneTimeToken {
  private constructor(
    readonly id: string,
    readonly tokenHash: string,
    readonly userId: string,
    readonly expiresAt: string,
    private usedAtValue: string | undefined,
    readonly createdAt: string,
  ) {}

  static issue(input: {
    id: string;
    tokenHash: string;
    userId: string;
    clock: Clock;
  }): OneTimeToken {
    const now = input.clock.now();
    const expiresAt = new Date(now.getTime() + TOKEN_LIFETIME_MS);

    return new OneTimeToken(
      input.id,
      input.tokenHash,
      input.userId,
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
  consume(clock: Clock): void {
    if (this.isUsed() || this.isExpired(clock)) {
      throw DomainError.field('token', 'Odkaz už není platný. Vyžádejte si nový.');
    }

    this.usedAtValue = clock.now().toISOString();
  }

  toState(): OneTimeTokenState {
    const state: OneTimeTokenState = {
      id: this.id,
      tokenHash: this.tokenHash,
      userId: this.userId,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
    };

    if (this.usedAtValue) state.usedAt = this.usedAtValue;
    return state;
  }
}
