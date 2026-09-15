import { createHash, timingSafeEqual } from 'node:crypto';
import {
  app,
  type HttpMethod,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { issuesToDetails } from '@fridrich/shared';
import * as v from 'valibot';
import { resolveSession } from '../application/identity/session.js';
import type { User } from '../domain/identity/User.js';
import { getConfig } from '../config.js';
import { DomainError } from '../domain/shared/DomainError.js';
import { identityDeps } from '../infrastructure/container.js';
import { readSessionToken } from './cookies.js';
import {
  errorResponse,
  json,
  methodNotAllowed,
  noContent,
  preflight,
  readJson,
  serverError,
  toResponse,
} from './responses.js';

/**
 * Definice endpointu – jeden soubor `*.endpoint.ts` = jeden endpoint.
 *
 * Soubor endpointu drží všechno, co k HTTP kontraktu patří: metodu, cestu,
 * Valibot schémata parametrů, query, těla i odpovědi a tenký `handle`, který
 * zavolá use-case. Tahle obálka za něj udělá zbytek: ověří session, rozparsuje
 * vstup (neplatný = 400 s detaily po polích) a přeloží doménové chyby na HTTP.
 * Business logika do `handle` nepatří – ta je v doméně (doc/wiki/architecture/endpoints.md).
 */

type AnySchema = v.GenericSchema;

/** Výstup schématu; bez schématu `undefined`. */
type Parsed<TSchema> = TSchema extends AnySchema ? v.InferOutput<TSchema> : undefined;

/**
 * `public` – kdokoli; `user` – přihlášený uživatel; `maintenance` – jen plánovač
 * údržby s tajným tokenem v hlavičce `x-maintenance-token` (`MAINTENANCE_TOKEN`).
 */
export type EndpointAccess = 'public' | 'user' | 'maintenance';

/** Hlavička s tokenem plánovače – vlastní, protože `Authorization` si Static Web Apps může brát pro sebe. */
export const MAINTENANCE_TOKEN_HEADER = 'x-maintenance-token';

export interface EndpointInput<TParams, TQuery, TBody, TAccess extends EndpointAccess> {
  params: TParams;
  query: TQuery;
  body: TBody;
  /** Přihlášený uživatel – u veřejného endpointu `undefined`. */
  user: TAccess extends 'user' ? User : undefined;
  request: HttpRequest;
  context: InvocationContext;
}

export type EndpointResult<TResponse> =
  | { status: 200 | 201 | 202; body: TResponse; headers?: Record<string, string> }
  | { status: 204; headers?: Record<string, string> };

export interface EndpointSpec<TAccess extends EndpointAccess, TParams, TQuery, TBody, TResponse> {
  /** Jméno endpointu – stejné jako název souboru a funkce na frontendu. */
  name: string;
  method: Exclude<HttpMethod, 'OPTIONS'>;
  /** Cesta bez prefixu `/api`, parametry ve složených závorkách. */
  route: string;
  /** `user` pustí dál jen přihlášeného – kontrolu si handler nepíše sám. */
  access: TAccess;
  params?: TParams;
  query?: TQuery;
  body?: TBody;
  /** Schéma odpovědi – na backendu hlídá typ toho, co `handle` vrací. */
  response?: TResponse;
  handle(
    input: EndpointInput<Parsed<TParams>, Parsed<TQuery>, Parsed<TBody>, TAccess>,
  ): Promise<EndpointResult<Parsed<TResponse>>>;
}

export interface Endpoint {
  name: string;
  method: HttpMethod;
  route: string;
  invoke(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;
}

export function defineEndpoint<
  TAccess extends EndpointAccess,
  TParams extends AnySchema | undefined = undefined,
  TQuery extends AnySchema | undefined = undefined,
  TBody extends AnySchema | undefined = undefined,
  TResponse extends AnySchema | undefined = undefined,
>(spec: EndpointSpec<TAccess, TParams, TQuery, TBody, TResponse>): Endpoint {
  return {
    name: spec.name,
    method: spec.method,
    route: spec.route,

    async invoke(request, context) {
      try {
        let user: User | undefined;
        if (spec.access === 'user') {
          user = await resolveSession(identityDeps(), readSessionToken(request));
          if (!user) return errorResponse(request, DomainError.unauthorized());
        }

        if (
          spec.access === 'maintenance' &&
          !isMaintenanceTokenValid(request.headers.get(MAINTENANCE_TOKEN_HEADER))
        ) {
          return errorResponse(request, DomainError.unauthorized());
        }

        const params = parse(spec.params, request.params) as Parsed<TParams>;
        const query = parse(
          spec.query,
          Object.fromEntries(new URL(request.url).searchParams),
        ) as Parsed<TQuery>;
        const rawBody = spec.body ? await readJson(request) : undefined;
        const body = parse(spec.body, rawBody) as Parsed<TBody>;

        const result = await spec.handle({
          params,
          query,
          body,
          user: user as EndpointInput<unknown, unknown, unknown, TAccess>['user'],
          request,
          context,
        });

        if (result.status === 204) return noContent(request, result.headers);
        return json(request, result.status, result.body, result.headers);
      } catch (error) {
        const mapped = toResponse(request, error);
        if (mapped) return mapped;

        // Text výjimky ven nejde – detaily o vnitřku systému útočníkovi nepatří.
        context.error(`Neočekávaná chyba v endpointu ${spec.name}`, error);
        return serverError(request);
      }
    },
  };
}

/**
 * Porovná token plánovače s nastavením.
 *
 * Bez nastaveného tokenu neprojde nic – zapomenuté nastavení nesmí údržbu
 * otevřít každému. Porovnání otisků v konstantním čase neprozradí, kolik
 * znaků tokenu útočník trefil.
 */
function isMaintenanceTokenValid(received: string | null): boolean {
  const expected = getConfig().maintenanceToken;
  if (!expected || !received) return false;

  const expectedHash = createHash('sha256').update(expected).digest();
  const receivedHash = createHash('sha256').update(received).digest();
  return timingSafeEqual(expectedHash, receivedHash);
}

/** Rozparsuje vstup schématem; neplatný vstup skončí jako 400 s detaily po polích. */
function parse(schema: AnySchema | undefined, input: unknown): unknown {
  if (!schema) return undefined;

  const result = v.safeParse(schema, input);
  if (!result.success) throw DomainError.validation(issuesToDetails(result.issues));

  return result.output;
}

/**
 * Zaregistruje endpointy do Azure Functions.
 *
 * Runtime nedovolí dvě funkce na stejné cestě, i když obsluhují jiné metody –
 * `GET` i `POST /weddy/weddings` musí být jedna funkce. Endpointy se proto
 * seskupí podle cesty a na každou cestu vznikne jedna funkce, která vybere
 * endpoint podle metody. `OPTIONS` (preflight) obslouží všechny cesty stejně.
 */
export function registerEndpoints(endpoints: readonly Endpoint[]): void {
  const byRoute = new Map<string, Endpoint[]>();

  for (const endpoint of endpoints) {
    const group = byRoute.get(endpoint.route) ?? [];
    if (group.some((existing) => existing.method === endpoint.method)) {
      throw new Error(`Endpoint ${endpoint.method} /${endpoint.route} je definovaný dvakrát.`);
    }

    group.push(endpoint);
    byRoute.set(endpoint.route, group);
  }

  for (const [route, group] of byRoute) {
    const methods = group.map((endpoint) => endpoint.method);

    app.http(group.map((endpoint) => endpoint.name).join('-'), {
      route,
      authLevel: 'anonymous',
      methods: [...methods, 'OPTIONS'],
      handler: async (request, context) => {
        if (request.method === 'OPTIONS') return preflight(request);

        const endpoint = group.find((candidate) => candidate.method === request.method);
        if (!endpoint) return methodNotAllowed(request, methods);

        return endpoint.invoke(request, context);
      },
    });
  }
}
