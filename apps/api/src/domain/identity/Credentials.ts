import type { Clock } from '../shared/Clock.js';
import type { Password } from './Password.js';
import type { PasswordHasher } from './PasswordHasher.js';

export interface CredentialsState {
  userId: string;
  passwordHash: string;
  updatedAt: string;
}

/**
 * Přihlašovací údaje uživatele – oddělený agregát od `User`.
 *
 * Důvod je praktický: profil se čte a posílá na frontend při každém
 * požadavku, hash hesla jen při přihlášení. Když žijí v jiném dokumentu,
 * nemůže hash omylem odejít v odpovědi.
 */
export class Credentials {
  private constructor(
    readonly userId: string,
    private hash: string,
    private updatedAtValue: string,
  ) {}

  static async create(input: {
    userId: string;
    password: Password;
    hasher: PasswordHasher;
    clock: Clock;
  }): Promise<Credentials> {
    const hash = await input.hasher.hash(input.password);
    return new Credentials(input.userId, hash, input.clock.now().toISOString());
  }

  static fromState(state: CredentialsState): Credentials {
    return new Credentials(state.userId, state.passwordHash, state.updatedAt);
  }

  get passwordHash(): string {
    return this.hash;
  }

  get updatedAt(): string {
    return this.updatedAtValue;
  }

  matches(password: Password, hasher: PasswordHasher): Promise<boolean> {
    return hasher.verify(this.hash, password);
  }

  /** Parametry hashování časem zesilujeme – tohle pozná zastaralý hash. */
  needsRehash(hasher: PasswordHasher): boolean {
    return hasher.needsRehash(this.hash);
  }

  async changeTo(password: Password, hasher: PasswordHasher, clock: Clock): Promise<void> {
    this.hash = await hasher.hash(password);
    this.updatedAtValue = clock.now().toISOString();
  }

  toState(): CredentialsState {
    return {
      userId: this.userId,
      passwordHash: this.hash,
      updatedAt: this.updatedAtValue,
    };
  }
}
