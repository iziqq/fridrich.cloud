import type { Credentials } from './Credentials.js';
import type { EmailAddress } from './EmailAddress.js';
import type { OneTimeToken, TokenPurpose } from './OneTimeToken.js';
import type { Session } from './Session.js';
import type { User } from './User.js';

/**
 * Porty modulu identity.
 *
 * Doména si říká, co potřebuje – implementace nad Cosmos DB je
 * v `infrastructure/cosmos`. Žádný typ z Cosmos SDK se sem nesmí dostat.
 */

export interface UserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: EmailAddress): Promise<User | undefined>;
  save(user: User): Promise<void>;
}

export interface CredentialsRepository {
  findByUserId(userId: string): Promise<Credentials | undefined>;
  save(credentials: Credentials): Promise<void>;
}

export interface TokenRepository {
  findByHash(tokenHash: string): Promise<OneTimeToken | undefined>;
  save(token: OneTimeToken): Promise<void>;
  /** Zneplatní starší nespotřebované tokeny stejného účelu. */
  invalidateAll(userId: string, purpose: TokenPurpose): Promise<void>;
}

export interface SessionRepository {
  findByHash(tokenHash: string): Promise<Session | undefined>;
  save(session: Session): Promise<void>;
  delete(sessionId: string, userId: string): Promise<void>;
  /** Odhlásí uživatele na všech zařízeních – po změně hesla. */
  deleteAllForUser(userId: string): Promise<void>;
}

/** Generátor náhodných tokenů a jejich otisků. */
export interface TokenGenerator {
  /** Vrátí token pro uživatele a jeho otisk pro databázi. */
  generate(): { token: string; tokenHash: string };
  hash(token: string): string;
}

export interface IdGenerator {
  next(): string;
}

/**
 * Počítadlo pokusů pro rate limiting.
 *
 * Sdílené napříč instancemi, aby limit nešlo obejít tím, že požadavek
 * spadne na jinou instanci Function App.
 */
export interface RateLimiter {
  /**
   * Zvýší počítadlo a vrátí `false`, pokud je limit vyčerpaný.
   * `key` typicky spojuje akci a IP nebo e-mail.
   */
  consume(key: string, limit: number, windowMs: number): Promise<boolean>;
}
