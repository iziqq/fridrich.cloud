import {
  ApiErrorBodySchema,
  commonKeys,
  errorKeys,
  issuesToDetails,
  type ApiErrorDetail,
} from '@fridrich/shared';
import * as v from 'valibot';
import { currentLocale } from '@/i18n';

/**
 * HTTP klient pro volání API.
 *
 * Nevolá se přímo z komponent ani ze store – každý endpoint má vlastní soubor
 * `<doména>/endpoints/<jméno>.endpoint.ts` se schématy requestu a response
 * a teprve ten volá `callEndpoint` (doc/wiki/architecture/endpoints.md).
 */

/**
 * Chyba z API – nese i validační detaily po jednotlivých polích.
 * `message` i hlášky v `details` jsou klíče katalogu; na obrazovce je přeloží
 * `translateMessage` z `@/i18n`.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Mapa `pole → klíč hlášky` pro zvýraznění chyb ve formuláři. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((detail) => [detail.field, detail.message]));
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface EndpointCall<TResponse extends v.GenericSchema | undefined> {
  method: HttpMethod;
  /** Cesta bez prefixu `/api`, parametry už dosazené (a zakódované). */
  path: string;
  query?: Record<string, string | undefined>;
  /**
   * Tělo i se schématem. Validuje se před odesláním – neplatná data skončí
   * stejnou `ApiError` jako odpověď 400, takže formulář je zobrazí bez
   * kolečka na server. Odešle se výstup schématu (oříznutý, normalizovaný).
   */
  body?: { schema: v.GenericSchema; value: unknown };
  /** Schéma odpovědi. Odpověď, která mu neodpovídá, je chyba, ne data. */
  response?: TResponse;
}

type ResponseOf<TResponse> = TResponse extends v.GenericSchema ? v.InferOutput<TResponse> : void;

export async function callEndpoint<TResponse extends v.GenericSchema | undefined = undefined>(
  call: EndpointCall<TResponse>,
): Promise<ResponseOf<TResponse>> {
  let body: string | undefined;
  if (call.body) {
    const parsed = v.safeParse(call.body.schema, call.body.value);
    if (!parsed.success) {
      throw new ApiError(400, 'ValidationError', commonKeys.invalidData, issuesToDetails(parsed.issues));
    }
    body = JSON.stringify(parsed.output);
  }

  const response = await fetch(`/api${call.path}${queryString(call.query)}`, {
    method: call.method,
    // Jazyk rozhraní – API v něm posílá e-maily a přihlášenému uživateli ho uloží k účtu.
    headers: {
      'Accept-Language': currentLocale.value,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body,
    // Session cookie musí jít s každým požadavkem.
    credentials: 'include',
  });

  if (!response.ok) throw await errorFrom(response);
  if (!call.response || response.status === 204) return undefined as ResponseOf<TResponse>;

  const parsed = v.safeParse(call.response, await response.json());
  if (!parsed.success) {
    console.error(`Neočekávaná odpověď z ${call.method} /api${call.path}`, parsed.issues);
    throw new ApiError(response.status, 'InvalidResponse', errorKeys.invalidResponse);
  }

  return parsed.output as ResponseOf<TResponse>;
}

function queryString(query: Record<string, string | undefined> | undefined): string {
  if (!query) return '';

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) search.set(key, value);
  }

  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

async function errorFrom(response: Response): Promise<ApiError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    // odpověď bez JSON těla (výpadek, proxy, přesměrování)
  }

  const parsed = v.safeParse(ApiErrorBodySchema, payload);
  if (!parsed.success) {
    return new ApiError(response.status, 'InternalServerError', errorKeys.requestFailed);
  }

  return new ApiError(
    response.status,
    parsed.output.error,
    parsed.output.message,
    parsed.output.details ?? [],
  );
}
