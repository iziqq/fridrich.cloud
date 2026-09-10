import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { resolveSession } from '../application/identity/session.js';
import { identityDeps } from '../infrastructure/container.js';
import type { User } from '../domain/identity/User.js';
import { DomainError } from '../domain/shared/DomainError.js';
import { readSessionToken } from './cookies.js';
import { errorResponse, preflight, serverError, toResponse } from './responses.js';

export type PublicHandler = (
  request: HttpRequest,
  context: InvocationContext,
) => Promise<HttpResponseInit>;

export type AuthenticatedHandler = (
  request: HttpRequest,
  context: InvocationContext,
  user: User,
) => Promise<HttpResponseInit>;

/**
 * Obálka veřejného endpointu.
 *
 * Odbaví preflight a přeloží doménové chyby na HTTP. Neočekávaná výjimka
 * skončí jako 500 a do logu – ven se nedostane její text, aby detaily
 * o vnitřku systému nešly k útočníkovi.
 */
export function publicEndpoint(handler: PublicHandler): PublicHandler {
  return async (request, context) => {
    if (request.method === 'OPTIONS') return preflight(request);

    try {
      return await handler(request, context);
    } catch (error) {
      const mapped = toResponse(request, error);
      if (mapped) return mapped;

      context.error('Neočekávaná chyba při zpracování požadavku', error);
      return serverError(request);
    }
  };
}

/**
 * Obálka chráněného endpointu.
 *
 * Ověření session je tady jednou pro všechny – žádný handler si ho nepíše
 * sám, takže nemůže vzniknout endpoint, kde se na kontrolu zapomnělo
 * (doc/architecture.md, kap. 5).
 */
export function authenticatedEndpoint(handler: AuthenticatedHandler): PublicHandler {
  return publicEndpoint(async (request, context) => {
    const user = await resolveSession(identityDeps(), readSessionToken(request));
    if (!user) return errorResponse(request, DomainError.unauthorized());

    return handler(request, context, user);
  });
}
