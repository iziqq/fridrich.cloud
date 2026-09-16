import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { LOGIN_CODE_LENGTH } from '@fridrich/shared';
import { getConfig } from '../config.js';
import type { IdGenerator, TokenGenerator } from '../domain/identity/ports.js';
import type { Fingerprint } from '../domain/shared/Fingerprint.js';

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

/**
 * Otisk údaje, který se jen porovnává (IP adresa, e-mail pozvánky).
 *
 * Na rozdíl od tokenů tady jde o hodnoty z malé, uhodnutelné množiny – IPv4
 * adres jsou čtyři miliardy, e-maily se dají vzít ze seznamu. Holý SHA-256 by
 * se dal předpočítat, proto HMAC s tajným kořením z nastavení: bez něj z otisku
 * nikdo původní hodnotu nedostane. Hodnota se před otiskem sjednotí (ořez,
 * malá písmena), aby `Jan@Example.com ` a `jan@example.com` daly tentýž otisk.
 */
export const fingerprint: Fingerprint = {
  of(value: string): string {
    const pepper = getConfig().pseudonymPepper;
    /*
     * Radši spadnout než počítat otisky bez koření: takový otisk by se dal
     * hrubou silou rozluštit a tvářil by se přitom jako ochrana. Chyba
     * shodí jen cesty, které otisky používají – zbytek webu běží dál.
     */
    if (!pepper) throw new Error('Chybí povinné nastavení "PSEUDONYM_PEPPER".');

    return createHmac('sha256', pepper)
      .update(value.trim().toLowerCase())
      .digest('hex');
  },
};
