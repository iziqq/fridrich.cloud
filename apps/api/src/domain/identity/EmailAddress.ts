import { AccountEmailSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { DomainError } from '../shared/DomainError.js';

/**
 * E-mailová adresa jako hodnotový objekt.
 *
 * Normalizace na malá písmena je tu schválně na jednom místě – jinak by se
 * dřív nebo později stalo, že se uživatel registruje jako `Jan@…` a pak se
 * marně přihlašuje jako `jan@…`. Pravidla tvaru jsou schéma
 * `AccountEmailSchema`, stejné, jaké používá formulář i endpoint.
 */
export class EmailAddress {
  private constructor(readonly value: string) {}

  static create(raw: string, field = 'email'): EmailAddress {
    const result = v.safeParse(AccountEmailSchema, raw);
    if (!result.success) {
      throw DomainError.field(field, result.issues[0].message);
    }

    return new EmailAddress(result.output);
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
