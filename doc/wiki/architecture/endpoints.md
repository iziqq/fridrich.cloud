---
title: Endpoints – one file per endpoint
type: concept
sources:
  - raw/2026-09-15-domainArchitecture.md
  - code: apps/api/src/http/endpoint.ts, apps/portal/src/api/http.ts
updated: 2026-09-15
---

# Endpoints – one file per endpoint

> Every endpoint has **one file on the backend and one on the frontend**, both
> named `<name>.endpoint.ts` and placed in their domain folder. The file holds
> everything that belongs to the HTTP contract: method, path, Valibot request
> and response schemas and the types derived from them. It never contains
> business logic.

## Naming

| What | Convention | Example |
|---|---|---|
| Endpoint name | `<verb><Noun>` in camelCase, identical on FE and BE | `createGuest`, `changeGuestStatus`, `getBudget` |
| File | `<name>.endpoint.ts` | `createGuest.endpoint.ts` |
| Backend location | `apps/api/src/endpoints/<domain>/[<subdomain>/]` | `endpoints/weddy/guests/` |
| Frontend location | `apps/portal/src/<domain>/[<subdomain>/]endpoints/` | `weddy/guests/endpoints/` |
| Body schema | `<Name>Request` | `CreateGuestRequest` |
| Response schema | `<Name>Response` | `CreateGuestResponse` |
| Path / query schema (BE, FE query) | `<Name>Params`, `<Name>Query` | `ListGuestsQuery` |
| Type | same name as the schema (`export type X = v.InferOutput<typeof X>`) | `type CreateGuestResponse` |
| Backend export | `<name>Endpoint` | `createGuestEndpoint` |
| Frontend export | function `<name>(…)` | `createGuest(weddingId, request)` |

Verbs: `list` (collection), `get` (one record / calculation), `create`,
`update` (full replace, PUT), `change<Field>` (PATCH of one field), `delete`.
Exceptions only where the domain speaks differently (`register`,
`requestLoginCode`, `verifyLoginCode`, `submitContactMessage`).

## Backend – `defineEndpoint`

```ts
// apps/api/src/endpoints/weddy/guests/createGuest.endpoint.ts
import { GuestInputSchema, GuestSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { createGuest } from '../../../application/weddy/guests.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `POST /api/weddy/weddings/{weddingId}/guests` – add a guest. */

export const CreateGuestParams = v.object({ weddingId: v.string() });
export type CreateGuestParams = v.InferOutput<typeof CreateGuestParams>;

export const CreateGuestRequest = GuestInputSchema;
export type CreateGuestRequest = v.InferOutput<typeof CreateGuestRequest>;

export const CreateGuestResponse = GuestSchema;
export type CreateGuestResponse = v.InferOutput<typeof CreateGuestResponse>;

export const createGuestEndpoint = defineEndpoint({
  name: 'createGuest',
  method: 'POST',
  route: 'weddy/weddings/{weddingId}/guests',
  access: 'user',                 // 'public' | 'user'
  params: CreateGuestParams,
  body: CreateGuestRequest,
  response: CreateGuestResponse,  // type-checks the return value of handle
  async handle({ params, body, user }) {
    return {
      status: 201,
      body: await createGuest(weddyDeps(), params.weddingId, body, user.id),
    };
  },
});
```

What the `defineEndpoint` wrapper (`apps/api/src/http/endpoint.ts`) does for the handler:

1. `access: 'user'` → verifies the session cookie; without it returns `401`.
   `user` is then typed as `User` in `handle`; for `public` it is `undefined`.
2. Parses `params`, `query` (from the URL) and `body` (JSON) with their schemas.
   Invalid input → `400` with `details: [{ field: 'groom.firstName', message }]`
   and `handle` is never called.
3. Turns the result `{ status, body, headers }` into a response (`204` without a body).
4. Translates `DomainError` to a status code (`validation 400`, `unauthorized 401`,
   `forbidden 403`, `notFound 404`, `conflict 409`, `tooManyRequests 429`).
   Anything else is logged and returns `500` without the error text.

**Registration:** the endpoint must be listed in `apps/api/src/index.ts`.
`registerEndpoints()` groups endpoints by route and registers one Azure
function per route (the runtime does not allow two functions on the same route),
including `OPTIONS`. A duplicate method + route fails application start.

**What belongs in `handle`:** extract arguments from `params`/`body`, call
**one** use case, return status and body, optionally a header (`Set-Cookie`).
**What does not:** conditions over data, calculations, repository access,
access checks – that is the use case or the domain.

## Frontend – `callEndpoint`

```ts
// apps/portal/src/weddy/guests/endpoints/createGuest.endpoint.ts
import { GuestInputSchema, GuestSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/weddy/weddings/{weddingId}/guests` – add a guest. */

export const CreateGuestRequest = GuestInputSchema;
export type CreateGuestRequest = v.InferInput<typeof CreateGuestRequest>;

export const CreateGuestResponse = GuestSchema;
export type CreateGuestResponse = v.InferOutput<typeof CreateGuestResponse>;

export function createGuest(
  weddingId: string,
  request: CreateGuestRequest,
): Promise<CreateGuestResponse> {
  return callEndpoint({
    method: 'POST',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/guests`,
    body: { schema: CreateGuestRequest, value: request },
    response: CreateGuestResponse,
  });
}
```

What `callEndpoint` (`apps/portal/src/api/http.ts`) does:

1. **Validates the body before sending.** Invalid data throws
   `ApiError(400, 'ValidationError', …, details)` – the same error the backend
   would return, so the form shows field errors without a round trip. The
   **output** of the schema (trimmed, normalised) is what gets sent.
2. Sends the request to `/api…` with `credentials: 'include'` (session cookie).
3. Parses an error response with `ApiErrorBodySchema` → `ApiError`
   (`status`, `code`, `details`, `fieldErrors`).
4. **Validates the response** with the `response` schema. If it does not match,
   that is an `InvalidResponse` error, not data – a drifted contract is noticed immediately.

On the FE the request type is `v.InferInput` (what the caller sends, before
transformations) and the response type is `v.InferOutput`. On the BE both are
`InferOutput` (the handler receives already parsed data).

## Keeping FE and BE in sync

Endpoint schemas are **written separately on FE and BE, but composed from the
same building blocks** in the shared kernel (`GuestInputSchema`, `GuestSchema`, …).
Field rules therefore exist once; endpoint files only add the envelope
(`{ guests, stats }`, `{ status }`). When a contract changes, **both files change
in the same commit** – the shared file name finds them with
`find -name 'createGuest.endpoint.ts'`.

## Checklist: a new endpoint

1. Rules for new fields → schema in the shared kernel (`packages/<product>-shared`), see [valibot.md](valibot.md).
2. Behaviour → domain object / domain function; orchestration → use case in `application/`.
3. Backend: `endpoints/<domain>/<subdomain>/<name>.endpoint.ts` following the pattern above.
4. Register it in `apps/api/src/index.ts`.
5. Frontend: `<domain>/<subdomain>/endpoints/<name>.endpoint.ts` with the same schemas.
6. Call it from a store (shared state) or a view (one-off call). Store actions
   are **not named like the endpoint** (`addFamily` calls `createFamily`).
7. Tests: domain and use case with an in-memory repository, new schema rules in
   `apps/api/test/schemas.test.ts`.
8. Wiki: endpoint table on the subdomain page, [index](../index.md), [log](../log.md).

## Related

- [Domain architecture](domains.md)
- [Valibot](valibot.md)
- [Backend](backend.md) · [Frontend](frontend.md)
