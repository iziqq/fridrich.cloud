import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import type { Password } from '../domain/identity/Password.js';
import type { PasswordHasher } from '../domain/identity/PasswordHasher.js';
import type { IdGenerator, TokenGenerator } from '../domain/identity/ports.js';

/**
 * Parametry Argon2id podle doporučení OWASP (19 MiB, 2 iterace, 1 vlákno).
 *
 * Až se budou zvyšovat, `needsRehash()` postupně převede existující účty
 * při přihlášení – jednorázová migrace hesel není možná, protože originály
 * neznáme.
 */
const ARGON_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

/** Hash neexistujícího hesla pro vyrovnání času odpovědi. */
let dummyHashPromise: Promise<string> | undefined;

export const argon2Hasher: PasswordHasher = {
  async hash(password: Password) {
    return argonHash(password.reveal(), ARGON_OPTIONS);
  },

  async verify(encodedHash: string, password: Password) {
    try {
      return await argonVerify(encodedHash, password.reveal(), ARGON_OPTIONS);
    } catch {
      // Poškozený nebo cizí formát hashe znamená „neověřeno", ne pád.
      return false;
    }
  },

  needsRehash(encodedHash: string) {
    const memoryMatch = /\bm=(\d+)/.exec(encodedHash);
    const timeMatch = /\bt=(\d+)/.exec(encodedHash);

    if (!encodedHash.startsWith('$argon2id$')) return true;
    if (!memoryMatch?.[1] || !timeMatch?.[1]) return true;

    return (
      Number(memoryMatch[1]) < ARGON_OPTIONS.memoryCost ||
      Number(timeMatch[1]) < ARGON_OPTIONS.timeCost
    );
  },

  async dummyVerify() {
    dummyHashPromise ??= argonHash('dummy-password-for-timing', ARGON_OPTIONS);
    const encoded = await dummyHashPromise;
    try {
      await argonVerify(encoded, 'wrong-password', ARGON_OPTIONS);
    } catch {
      // výsledek nikoho nezajímá, jde jen o strávený čas
    }
  },
};

/**
 * Tokeny do session cookie a do e-mailových odkazů.
 *
 * 32 bajtů z kryptograficky bezpečného zdroje; v databázi leží jen SHA-256
 * otisk. Otisk stačí – token je dost dlouhý a náhodný na to, aby ho nešlo
 * uhodnout ani předpočítat, takže není potřeba pomalá hashovací funkce.
 */
export const tokenGenerator: TokenGenerator = {
  generate() {
    const token = randomBytes(32).toString('base64url');
    return { token, tokenHash: this.hash(token) };
  },

  hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  },
};

export const uuidGenerator: IdGenerator = {
  next: () => randomUUID(),
};

/** Porovnání odolné vůči odvození obsahu z délky trvání. */
export function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
