import { commonKeys, errorKeys, type ApiErrorDetail } from '@fridrich/shared';

/**
 * Chyba, kterou vyhazuje doména nebo use-case.
 *
 * Doména nezná HTTP – nese jen `kind`, který si vrstva `http/` přeloží
 * na stavový kód. `message` i hlášky v `details` jsou klíče katalogu
 * (`shared.errors.notFound`), ne věty – text podle jazyka doplní frontend. Díky tomu jde stejná logika volat i mimo HTTP (skript,
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

  static validation(details: ApiErrorDetail[], message = commonKeys.invalidData): DomainError {
    return new DomainError('validation', message, details);
  }

  static field(field: string, message: string): DomainError {
    return new DomainError('validation', commonKeys.invalidData, [{ field, message }]);
  }

  static unauthorized(message = errorKeys.unauthorized): DomainError {
    return new DomainError('unauthorized', message);
  }

  static forbidden(message = errorKeys.forbidden): DomainError {
    return new DomainError('forbidden', message);
  }

  static notFound(message = errorKeys.notFound): DomainError {
    return new DomainError('notFound', message);
  }

  static conflict(message: string): DomainError {
    return new DomainError('conflict', message);
  }

  static tooManyRequests(message = errorKeys.tooManyRequests): DomainError {
    return new DomainError('tooManyRequests', message);
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
