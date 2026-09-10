import { DomainError } from '../shared/DomainError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_LENGTH = 254;

/**
 * E-mailová adresa jako hodnotový objekt.
 *
 * Normalizace na malá písmena je tu schválně na jednom místě – jinak by se
 * dřív nebo později stalo, že se uživatel registruje jako `Jan@…` a pak se
 * marně přihlašuje jako `jan@…`.
 */
export class EmailAddress {
  private constructor(readonly value: string) {}

  static create(raw: unknown, field = 'email'): EmailAddress {
    if (typeof raw !== 'string' || raw.trim() === '') {
      throw DomainError.field(field, 'Vyplňte e-mail');
    }

    const normalized = raw.trim().toLowerCase();

    if (normalized.length > MAX_LENGTH || !EMAIL_RE.test(normalized)) {
      throw DomainError.field(field, 'Zadejte platný e-mail');
    }

    return new EmailAddress(normalized);
  }

  /** Načtení z databáze – hodnota je už normalizovaná, jen ji zabalíme. */
  static fromStored(value: string): EmailAddress {
    return new EmailAddress(value);
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
