import { isValidEmail } from '@fridrich/shared';
import type { Person as PersonData, PersonInput } from '@fridrich/weddy-shared';
import { DomainError } from '../shared/DomainError.js';

const NAME_MAX = 100;
const MIN_BIRTH_YEAR = 1900;

/**
 * Snoubenec jako hodnotový objekt.
 *
 * Validační pravidla jsou tady, ne ve funkci, která přijímá HTTP požadavek –
 * platí stejně, ať data přijdou z API, importu nebo testu.
 */
export class Person {
  private constructor(private readonly data: PersonData) {}

  static create(raw: unknown, prefix: string, currentYear: number): Person {
    const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
    const details: { field: string; message: string }[] = [];

    const firstName = Person.text(input['firstName'], `${prefix}.firstName`, 'Jméno', details);
    const lastName = Person.text(input['lastName'], `${prefix}.lastName`, 'Příjmení', details);

    const data: PersonData = { firstName, lastName };

    const birthYear = input['birthYear'];
    if (birthYear !== undefined && birthYear !== null && birthYear !== '') {
      const year = Number(birthYear);
      if (!Number.isInteger(year) || year < MIN_BIRTH_YEAR || year > currentYear) {
        details.push({
          field: `${prefix}.birthYear`,
          message: `Rok narození musí být mezi ${MIN_BIRTH_YEAR} a ${currentYear}`,
        });
      } else {
        data.birthYear = year;
      }
    }

    const email = Person.optional(input['email']);
    if (email !== undefined) {
      if (!isValidEmail(email)) {
        details.push({ field: `${prefix}.email`, message: 'Zadejte platný e-mail' });
      } else {
        data.email = email.toLowerCase();
      }
    }

    const phone = Person.optional(input['phone']);
    if (phone !== undefined) {
      if (phone.length > 40) {
        details.push({ field: `${prefix}.phone`, message: 'Telefon je příliš dlouhý' });
      } else {
        data.phone = phone;
      }
    }

    const note = Person.optional(input['note']);
    if (note !== undefined) {
      if (note.length > 2000) {
        details.push({ field: `${prefix}.note`, message: 'Poznámka je příliš dlouhá' });
      } else {
        data.note = note;
      }
    }

    if (details.length > 0) throw DomainError.validation(details);

    return new Person(data);
  }

  static fromState(data: PersonData): Person {
    return new Person(data);
  }

  private static text(
    raw: unknown,
    field: string,
    label: string,
    details: { field: string; message: string }[],
  ): string {
    if (typeof raw !== 'string' || raw.trim() === '') {
      details.push({ field, message: `Vyplňte ${label.toLowerCase()}` });
      return '';
    }

    const trimmed = raw.trim();
    if (trimmed.length > NAME_MAX) {
      details.push({ field, message: `${label} může mít nejvýše ${NAME_MAX} znaků` });
    }

    return trimmed;
  }

  private static optional(raw: unknown): string | undefined {
    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();
    return trimmed === '' ? undefined : trimmed;
  }

  get fullName(): string {
    return `${this.data.firstName} ${this.data.lastName}`.trim();
  }

  toState(): PersonData {
    return { ...this.data };
  }

  toInput(): PersonInput {
    return { ...this.data };
  }
}
