import type { EmailAddress } from './EmailAddress.js';
import type { LoginCode } from './LoginCode.js';
import type { OneTimeToken } from './OneTimeToken.js';
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
  /**
   * Neaktivní účty, se kterými má údržba co dělat, nejvýš `limit` najednou:
   * bez aktivity od `inactiveBefore` (ISO datum) a zároveň bez upozornění,
   * nebo s upozorněním nejpozději v `warnedBefore`. Čerstvě upozorněné účty
   * se nevrací, aby dávku neucpaly. Aktivita = `lastSeenAt`, u starších účtů registrace.
   */
  listForRetention(inactiveBefore: string, warnedBefore: string, limit: number): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface TokenRepository {
  findByHash(tokenHash: string): Promise<OneTimeToken | undefined>;
  save(token: OneTimeToken): Promise<void>;
  /** Zneplatní starší nespotřebované ověřovací odkazy uživatele. */
  invalidateAll(userId: string): Promise<void>;
  /** Smaže všechny odkazy uživatele včetně použitých – při smazání účtu. */
  deleteAllForUser(userId: string): Promise<void>;
}

/**
 * Smazání dat, která o uživateli drží jiné domény (produkty).
 *
 * Identity neví, co produkty ukládají, a domény se navzájem nevolají
 * (CLAUDE.md, pravidlo 3). Každý produkt proto dodá vlastní implementaci
 * a propojí je až `infrastructure/container.ts`.
 */
export interface UserDataEraser {
  eraseUserData(user: { id: string; email: string }): Promise<void>;
}

/**
 * Oznámení, že vznikl nový účet.
 *
 * Produkty na něj mohou navázat, co si u e-mailu schovaly, než účet vznikl –
 * IziWeddy takhle promění čekající pozvánku v přístup k plánování. Identity
 * o produktech neví, implementace se propojí v `infrastructure/container.ts`.
 */
export interface UserRegistrationListener {
  onUserRegistered(user: { id: string; email: string }): Promise<void>;
}

export interface LoginCodeRepository {
  /** Poslední vystavená výzva uživatele; starší se při vystavení nové ruší. */
  findForUser(userId: string): Promise<LoginCode | undefined>;
  save(challenge: LoginCode): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}

export interface SessionRepository {
  findByHash(tokenHash: string): Promise<Session | undefined>;
  save(session: Session): Promise<void>;
  delete(sessionId: string, userId: string): Promise<void>;
  /** Odhlásí uživatele na všech zařízeních. */
  deleteAllForUser(userId: string): Promise<void>;
}

/**
 * Generátor náhodných hodnot a jejich otisků.
 *
 * Doména potřebuje tokeny do odkazů, šestimístné kódy a porovnání otisku –
 * odkud se bere náhoda a jaká hashovací funkce je pod tím, ji nezajímá.
 */
export interface TokenGenerator {
  /** Vrátí token pro uživatele a jeho otisk pro databázi. */
  generate(): { token: string; tokenHash: string };
  /** Šestimístný přihlašovací kód z kryptograficky bezpečného zdroje. */
  generateCode(): string;
  hash(value: string): string;
  /** Porovnání otisku odolné vůči odvození obsahu z délky trvání. */
  matches(hash: string, value: string): boolean;
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
