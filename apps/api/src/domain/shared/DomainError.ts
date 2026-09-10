import type { ApiErrorDetail } from '@fridrich/shared';

/**
 * Chyba, kterou vyhazuje doména nebo use-case.
 *
 * Doména nezná HTTP – nese jen `kind`, který si vrstva `functions/` přeloží
 * na stavový kód. Díky tomu jde stejná logika volat i mimo HTTP (skript,
 * fronta, test) a chování se nezmění.
 */
export type DomainErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'tooManyRequests';

export class DomainError extends Error {
  readonly kind: DomainErrorKind;
  readonly details: ApiErrorDetail[];

  constructor(kind: DomainErrorKind, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'DomainError';
    this.kind = kind;
    this.details = details;
  }

  static validation(details: ApiErrorDetail[], message = 'Neplatná data'): DomainError {
    return new DomainError('validation', message, details);
  }

  static field(field: string, message: string): DomainError {
    return new DomainError('validation', 'Neplatná data', [{ field, message }]);
  }

  static unauthorized(message = 'Přihlaste se prosím'): DomainError {
    return new DomainError('unauthorized', message);
  }

  static forbidden(message = 'K tomuto obsahu nemáte přístup'): DomainError {
    return new DomainError('forbidden', message);
  }

  static notFound(what = 'Záznam'): DomainError {
    return new DomainError('notFound', `${what} neexistuje`);
  }

  static conflict(message: string): DomainError {
    return new DomainError('conflict', message);
  }

  static tooManyRequests(message = 'Příliš mnoho pokusů. Zkuste to za chvíli.'): DomainError {
    return new DomainError('tooManyRequests', message);
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
