import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { LOGIN_CODE_LENGTH } from '@fridrich/shared';
import type { IdGenerator, TokenGenerator } from '../domain/identity/ports.js';

/**
 * Náhodné hodnoty pro session cookie, e-mailové odkazy a přihlašovací kódy.
 *
 * Tokeny mají 32 bajtů z kryptograficky bezpečného zdroje; v databázi leží
 * jen SHA-256 otisk. Otisk stačí – token je dost dlouhý a náhodný na to, aby
 * ho nešlo uhodnout ani předpočítat, takže není potřeba pomalá hashovací
 * funkce.
 *
 * U šestimístného kódu to neplatí: milion možností se z otisku dopočítá
 * během chvilky, takže se hashuje spolu s `id` výzvy a obrana stojí jinde –
 * na desetiminutové platnosti a počítadle pokusů v `LoginCode`.
 */
export const tokenGenerator: TokenGenerator = {
  generate() {
    const token = randomBytes(32).toString('base64url');
    return { token, tokenHash: this.hash(token) };
  },

  generateCode() {
    const max = 10 ** LOGIN_CODE_LENGTH;
    // `randomInt` bere z téhož zdroje jako `randomBytes` a nemá zkreslení
    // modulem, které by hádání kódu ulehčilo.
    return String(randomInt(0, max)).padStart(LOGIN_CODE_LENGTH, '0');
  },

  hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  },

  matches(hash: string, value: string) {
    return safeEquals(hash, this.hash(value));
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
