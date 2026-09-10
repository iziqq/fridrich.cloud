import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@fridrich/shared';
import { DomainError } from '../shared/DomainError.js';

/**
 * Hesla, která projdou délkovým limitem, ale útočník je zkusí jako první.
 * Krátká hesla (`123456`, `password`) tu nejsou schválně – ta neprojdou
 * už kvůli minimální délce.
 */
const WEAK_PASSWORDS = new Set([
  '123456789012',
  '1234567890123',
  '12345678901234',
  '123456789012345',
  'qwertyuiop123',
  'qwertyuiopasdf',
  'passwordpassword',
  'password123456',
  'heslo123456789',
  'administrator1',
  'letmeinletmein',
  'iloveyouiloveyou',
  'welcome123456',
  'abcdefghijkl',
  'aaaaaaaaaaaa',
  'zaq12wsxcde3',
]);

/**
 * Heslo v otevřené podobě.
 *
 * Existuje jen po dobu jednoho požadavku a nikdy se neserializuje – proto má
 * přebité `toJSON` i `toString`. Kdyby se objekt omylem dostal do logu nebo
 * do odpovědi, neunikne z něj heslo.
 */
export class Password {
  private constructor(private readonly plainText: string) {}

  static create(raw: unknown, context: { email?: string; displayName?: string } = {}): Password {
    if (typeof raw !== 'string' || raw === '') {
      throw DomainError.field('password', 'Vyplňte heslo');
    }

    if (raw.length < PASSWORD_MIN_LENGTH) {
      throw DomainError.field(
        'password',
        `Heslo musí mít alespoň ${PASSWORD_MIN_LENGTH} znaků`,
      );
    }

    if (raw.length > PASSWORD_MAX_LENGTH) {
      throw DomainError.field('password', `Heslo může mít nejvýše ${PASSWORD_MAX_LENGTH} znaků`);
    }

    const normalized = raw.toLowerCase();

    if (WEAK_PASSWORDS.has(normalized)) {
      throw DomainError.field('password', 'Tohle heslo je příliš běžné, zvolte jiné');
    }

    // Heslo odvozené z e-mailu nebo jména je první, co útočník zkusí.
    for (const value of [context.email, context.displayName]) {
      const candidate = value?.trim().toLowerCase();
      if (candidate && candidate.length >= 4 && normalized.includes(candidate)) {
        throw DomainError.field('password', 'Heslo nesmí obsahovat váš e-mail ani jméno');
      }
    }

    return new Password(raw);
  }

  /**
   * Heslo pro ověření při přihlášení.
   *
   * Politika se tu schválně neuplatňuje: účty založené dřív ji splňovat
   * nemusí a nechceme jim zamknout přihlášení tím, že zpřísníme pravidla.
   * Kontroluje se jen tvar, aby se do hasheru nedostal nesmysl.
   */
  static forVerification(raw: unknown): Password {
    if (typeof raw !== 'string' || raw === '' || raw.length > PASSWORD_MAX_LENGTH) {
      throw DomainError.field('password', 'Vyplňte heslo');
    }

    return new Password(raw);
  }

  /** Jediná cesta, jak se k otevřenému heslu dostat – používá ji jen hasher. */
  reveal(): string {
    return this.plainText;
  }

  toJSON(): string {
    return '[redacted]';
  }

  toString(): string {
    return '[redacted]';
  }
}
