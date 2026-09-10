import type { Password } from './Password.js';

/**
 * Port pro hashování hesel.
 *
 * Doména ví jen to, že heslo jde zahashovat a ověřit – jestli je pod tím
 * Argon2id, scrypt nebo něco dalšího, řeší infrastruktura. Až bude potřeba
 * parametry zesílit, mění se jedna implementace a `needsRehash()` postupně
 * převede existující uživatele při přihlášení.
 */
export interface PasswordHasher {
  hash(password: Password): Promise<string>;
  verify(encodedHash: string, password: Password): Promise<boolean>;
  /** True, pokud byl hash vytvořen slabšími parametry, než jaké platí teď. */
  needsRehash(encodedHash: string): boolean;
  /**
   * Ověření naprázdno pro neexistující účet.
   *
   * Bez něj by přihlášení na neznámý e-mail odpovědělo znatelně rychleji než
   * na existující, protože by se nehashovalo. Z rozdílu časů by šlo zjistit,
   * kdo je registrovaný.
   */
  dummyVerify(): Promise<void>;
}
