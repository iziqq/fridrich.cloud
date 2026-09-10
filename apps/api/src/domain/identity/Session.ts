import type { Clock } from '../shared/Clock.js';

/** Jak dlouho platí přihlášení, než se uživatel musí přihlásit znovu. */
export const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 dní

/** Po jaké době aktivity se platnost prodlouží (šetří zápisy do databáze). */
const SLIDING_REFRESH_MS = 24 * 60 * 60 * 1000; // 1 den

export interface SessionState {
  id: string;
  /** SHA-256 otisk tokenu ze session cookie. */
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  lastSeenAt: string;
}

/**
 * Přihlášení uživatele.
 *
 * Cookie nese jen neuhodnutelný náhodný token, žádná data o uživateli.
 * Díky tomu jde session kdykoli zneplatnit na serveru – při odhlášení,
 * při změně hesla nebo ručně (doc/architecture.md, kap. 5).
 */
export class Session {
  private constructor(
    readonly id: string,
    readonly tokenHash: string,
    readonly userId: string,
    private expiresAtValue: string,
    readonly createdAt: string,
    private lastSeenAtValue: string,
  ) {}

  static start(input: {
    id: string;
    tokenHash: string;
    userId: string;
    clock: Clock;
  }): Session {
    const now = input.clock.now();
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);

    return new Session(
      input.id,
      input.tokenHash,
      input.userId,
      expiresAt.toISOString(),
      now.toISOString(),
      now.toISOString(),
    );
  }

  static fromState(state: SessionState): Session {
    return new Session(
      state.id,
      state.tokenHash,
      state.userId,
      state.expiresAt,
      state.createdAt,
      state.lastSeenAt,
    );
  }

  get expiresAt(): string {
    return this.expiresAtValue;
  }

  get lastSeenAt(): string {
    return this.lastSeenAtValue;
  }

  isExpired(clock: Clock): boolean {
    return clock.now().getTime() >= new Date(this.expiresAtValue).getTime();
  }

  /**
   * Posune platnost při aktivitě. Vrací `true`, pokud se stav změnil a je
   * potřeba zápis – jinak by každý požadavek znamenal zápis do databáze.
   */
  touch(clock: Clock): boolean {
    const now = clock.now();
    const sinceLastSeen = now.getTime() - new Date(this.lastSeenAtValue).getTime();
    if (sinceLastSeen < SLIDING_REFRESH_MS) return false;

    this.lastSeenAtValue = now.toISOString();
    this.expiresAtValue = new Date(now.getTime() + SESSION_LIFETIME_MS).toISOString();
    return true;
  }

  toState(): SessionState {
    return {
      id: this.id,
      tokenHash: this.tokenHash,
      userId: this.userId,
      expiresAt: this.expiresAtValue,
      createdAt: this.createdAt,
      lastSeenAt: this.lastSeenAtValue,
    };
  }
}
