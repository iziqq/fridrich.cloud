import { identityKeys, LOGIN_CODE_LENGTH } from '@fridrich/shared';
import type { Clock } from '../shared/Clock.js';
import { DomainError } from '../shared/DomainError.js';
import type { TokenGenerator } from './ports.js';

/**
 * Jak dlouho platí kód, než se musí vyžádat nový.
 *
 * Krátce schválně: šestimístný kód má jen milion možností, takže hlavní
 * ochranou není jeho délka, ale to, že je platný chvilku a na pár pokusů.
 */
export const LOGIN_CODE_LIFETIME_MS = 10 * 60 * 1000; // 10 minut

/** Kolik špatných pokusů kód přežije, než se zahodí. */
export const LOGIN_CODE_MAX_ATTEMPTS = 5;

const DIGITS_RE = new RegExp(`^\\d{${LOGIN_CODE_LENGTH}}$`);

export interface LoginCodeState {
  id: string;
  /**
   * Otisk kódu spolu s `id` výzvy – samotných šest číslic by se z otisku
   * dopočítalo hrubou silou během chvilky.
   */
  codeHash: string;
  userId: string;
  expiresAt: string;
  attempts: number;
  createdAt: string;
}

/**
 * Přihlašovací výzva – kód, který uživateli přišel na e-mail.
 *
 * Držení schránky je tady jediný důkaz totožnosti, takže veškerá obrana
 * proti hádání kódu žije v tomhle objektu: krátká platnost, počítadlo
 * pokusů a jednorázovost. Volající nemá jak některé z pravidel obejít –
 * jediná cesta dovnitř vede přes `verify()`.
 */
export class LoginCode {
  private constructor(
    readonly id: string,
    readonly codeHash: string,
    readonly userId: string,
    readonly expiresAt: string,
    private attemptsValue: number,
    readonly createdAt: string,
  ) {}

  /** Vystaví novou výzvu a vrátí i kód, který se má poslat e-mailem. */
  static issue(input: {
    id: string;
    userId: string;
    generator: TokenGenerator;
    clock: Clock;
  }): { challenge: LoginCode; code: string } {
    const now = input.clock.now();
    const code = input.generator.generateCode();
    const expiresAt = new Date(now.getTime() + LOGIN_CODE_LIFETIME_MS);

    const challenge = new LoginCode(
      input.id,
      input.generator.hash(`${input.id}:${code}`),
      input.userId,
      expiresAt.toISOString(),
      0,
      now.toISOString(),
    );

    return { challenge, code };
  }

  static fromState(state: LoginCodeState): LoginCode {
    return new LoginCode(
      state.id,
      state.codeHash,
      state.userId,
      state.expiresAt,
      state.attempts,
      state.createdAt,
    );
  }

  get attempts(): number {
    return this.attemptsValue;
  }

  isExpired(clock: Clock): boolean {
    return clock.now().getTime() >= new Date(this.expiresAt).getTime();
  }

  isExhausted(): boolean {
    return this.attemptsValue >= LOGIN_CODE_MAX_ATTEMPTS;
  }

  /**
   * Ověří opsaný kód.
   *
   * Při neúspěchu zvedne počítadlo pokusů – volající musí výzvu uložit i
   * tehdy, když ověření selhalo, jinak by počítadlo nikdy nenarostlo.
   * Hláška je schválně jedna pro špatný, vypršený i vyčerpaný kód: z rozdílu
   * by šlo poznat, že se hádá správným směrem.
   */
  verify(code: string, generator: TokenGenerator, clock: Clock): void {
    if (this.isExpired(clock) || this.isExhausted()) throw LoginCode.rejected();

    this.attemptsValue += 1;

    const normalized = code.replace(/\s/g, '');
    if (!DIGITS_RE.test(normalized)) throw LoginCode.rejected();

    if (!generator.matches(this.codeHash, `${this.id}:${normalized}`)) {
      throw LoginCode.rejected();
    }
  }

  private static rejected(): DomainError {
    return DomainError.field('code', identityKeys.codeInvalid);
  }

  toState(): LoginCodeState {
    return {
      id: this.id,
      codeHash: this.codeHash,
      userId: this.userId,
      expiresAt: this.expiresAt,
      attempts: this.attemptsValue,
      createdAt: this.createdAt,
    };
  }
}
