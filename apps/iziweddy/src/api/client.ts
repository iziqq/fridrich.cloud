import type { ApiErrorBody, ApiErrorDetail } from '@fridrich/shared';

/** Chyba z API – nese i validační detaily po jednotlivých polích. */
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

  /** Mapa `pole → hláška` pro zvýraznění chyb ve formuláři. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((detail) => [detail.field, detail.message]));
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    // Session cookie musí jít s každým požadavkem, i na jinou doménu.
    credentials: 'include',
  });

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    let payload: Partial<ApiErrorBody> = {};
    try {
      payload = (await response.json()) as Partial<ApiErrorBody>;
    } catch {
      // odpověď bez JSON těla (výpadek, proxy, přesměrování)
    }

    throw new ApiError(
      response.status,
      payload.error ?? 'InternalServerError',
      payload.message ?? `Požadavek selhal (${response.status})`,
      payload.details ?? [],
    );
  }

  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: (path: string) => request<void>('DELETE', path),
};
