import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import type { ApiErrorBody, ApiErrorCode } from '@fridrich/shared';
import { getConfig } from '../config.js';
import { DomainError, isDomainError, type DomainErrorKind } from '../domain/shared/DomainError.js';

/** Překlad doménové chyby na HTTP – jediné místo, kde se to děje. */
const STATUS_BY_KIND: Record<DomainErrorKind, { status: number; code: ApiErrorCode }> = {
  validation: { status: 400, code: 'ValidationError' },
  unauthorized: { status: 401, code: 'Unauthorized' },
  forbidden: { status: 403, code: 'Forbidden' },
  notFound: { status: 404, code: 'NotFound' },
  conflict: { status: 409, code: 'Conflict' },
  tooManyRequests: { status: 429, code: 'TooManyRequests' },
};

/**
 * Hlavičky CORS.
 *
 * Řešíme je v kódu, ne nastavením Function App – frontend posílá session
 * cookie, a to vyžaduje konkrétní původ (`*` prohlížeč s přihlašovacími
 * údaji odmítne).
 */
export function corsHeaders(request: HttpRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  if (!origin) return {};

  const { allowedOrigins } = getConfig();
  if (!allowedOrigins.includes(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function json(
  request: HttpRequest,
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): HttpResponseInit {
  return {
    status,
    jsonBody: body,
    headers: {
      ...corsHeaders(request),
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  };
}

export function noContent(
  request: HttpRequest,
  extraHeaders: Record<string, string> = {},
): HttpResponseInit {
  return {
    status: 204,
    headers: { ...corsHeaders(request), ...extraHeaders },
  };
}

export function preflight(request: HttpRequest): HttpResponseInit {
  return { status: 204, headers: corsHeaders(request) };
}

export function errorResponse(request: HttpRequest, error: DomainError): HttpResponseInit {
  const mapping = STATUS_BY_KIND[error.kind];

  const body: ApiErrorBody = {
    error: mapping.code,
    message: error.message,
  };
  if (error.details.length > 0) body.details = error.details;

  return json(request, mapping.status, body);
}

export function methodNotAllowed(
  request: HttpRequest,
  allowed: readonly string[],
): HttpResponseInit {
  const body: ApiErrorBody = {
    error: 'NotFound',
    message: `Metoda ${request.method} není na této adrese podporovaná`,
  };
  return json(request, 405, body, { Allow: allowed.join(', ') });
}

export function serverError(request: HttpRequest): HttpResponseInit {
  const body: ApiErrorBody = {
    error: 'InternalServerError',
    message: 'Neočekávaná chyba serveru',
  };
  return json(request, 500, body);
}

export function toResponse(request: HttpRequest, error: unknown): HttpResponseInit | undefined {
  return isDomainError(error) ? errorResponse(request, error) : undefined;
}

/** Bezpečné načtení JSON těla; neplatný JSON vrací `undefined`. */
export async function readJson(request: HttpRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/**
 * IP klienta pro rate limiting.
 *
 * Pořadí zdrojů je tu podstatné, ne kosmetické:
 *
 * 1. `x-azure-clientip` nastavuje platforma a příchozí hodnotu přepisuje,
 *    takže se nedá podvrhnout.
 * 2. V `x-forwarded-for` je seznam `klient, proxy1, proxy2`, kde každá proxy
 *    připojuje adresu, ze které požadavek dostala. Bereme **poslední**
 *    položku – tu přidal front end Azure, takže odpovídá skutečnému spojení.
 *    První položku si posílá klient sám; kdyby se použila, stačilo by ji
 *    obměňovat a rate limiting by přestal platit.
 */
export function clientIp(request: HttpRequest): string {
  const azure = request.headers.get('x-azure-clientip')?.trim();
  if (azure) return stripPort(azure);

  const forwarded = request.headers.get('x-forwarded-for');
  const hops = forwarded?.split(',').map((hop) => hop.trim()).filter(Boolean) ?? [];
  const nearest = hops.at(-1);
  if (nearest) return stripPort(nearest);

  return request.headers.get('x-client-ip')?.trim() ?? 'unknown';
}

/** Azure připojuje k adrese port (`1.2.3.4:56789`), pro klíč limitu je navíc. */
function stripPort(address: string): string {
  return address.replace(/:\d+$/, '');
}
