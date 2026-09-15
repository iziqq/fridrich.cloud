---
title: Types and validation – Valibot
type: concept
sources:
  - raw/2026-09-15-domainArchitecture.md
  - code: packages/shared/src/validation.ts, packages/weddy-shared/src
updated: 2026-09-15
---

# Types and validation – Valibot

> Every type that crosses the wire or comes from a user is created from a
> **Valibot schema**, and the TypeScript type is derived from it
> (`v.InferOutput` / `v.InferInput`). No hand-written `interface` for API data.
> The same schema validates the form, the request on the backend and the
> response on the frontend.

Library: [`valibot`](https://valibot.dev) `^1.5`, always imported as
`import * as v from 'valibot'`. It is a dependency of `packages/shared`,
`packages/weddy-shared`, `apps/api` and `apps/portal`.

## Where schemas live

| Kind | Place | Example |
|---|---|---|
| Field building blocks (text, e-mail, URL, date) and error conversion | `packages/shared/src/validation.ts` | `requiredText`, `optionalText`, `emailText`, `optionalHttpUrl`, `optionalIsoDate`, `issuesToDetails` |
| Error contract and generic responses | `packages/shared/src/api.ts` | `ApiErrorBodySchema`, `MessageResponseSchema` |
| Identity and contact domains | `packages/shared/src/identity.ts`, `contact.ts` | `UserSchema`, `AccountEmailSchema`, `ContactMessageInputSchema` |
| Weddy domain – one file per subdomain | `packages/weddy-shared/src/<subdomain>.ts` | `WeddingInputSchema`, `GuestSchema`, `PlanningItemInputSchema`, `BudgetSummarySchema` |
| Envelope of a specific endpoint | the `*.endpoint.ts` file | `ListGuestsResponse = v.object({ guests, stats })` |

## Naming

- Schema: `<Thing>Schema` in the shared kernel, `<Name>Request|Response|Params|Query` in an endpoint.
- Type: without suffix (`type Guest = v.InferOutput<typeof GuestSchema>`).
- **Entity × input** pairs:
  - `GuestSchema` – what a record looks like in a response (no transformations, shape only).
  - `GuestInputSchema` – what comes from a form (rules, trimming, normalisation; no `id`, timestamps or defaults).
- Enums: an `as const` constant + `v.picklist` + labels:
  `GUEST_STATUSES` → `GuestStatusSchema` → `type GuestStatus` → `GUEST_STATUS_LABELS`.
  Checking a value of unknown origin: `v.is(PlanningCategorySchema, raw)`.

## Rules

1. **Messages are in Czech and meant for users** (they are product text) –
   passed to each action (`v.nonEmpty('Vyplňte jméno')`). Forms display them
   next to the field unchanged.
2. **Optional text:** an empty string after trimming becomes `undefined`
   (`optionalText`). The frontend can send field values as they are.
3. **Normalisation belongs in the schema:** trimming whitespace, lowercase
   e-mail, price rounded to whole crowns. The domain receives clean data.
4. **Default values do not belong in the schema** but in the domain
   (`status ?? 'draft'`) – they are business decisions, not data shape.
5. **State-dependent rules** (access, one-time use, attempt counters) do not
   belong in the schema – they are in the domain. A schema only checks what can
   be determined from the value itself.
6. **Security exception:** where the domain must return a uniform error, the
   endpoint schema is deliberately loose (`verifyLoginCode` accepts just two
   strings) so validation does not reveal more than the domain.
7. **Unknown keys are dropped** (`v.object` does not pass them to the output) –
   nothing the schema does not know reaches the domain.

## Errors and field paths

`issuesToDetails(issues)` converts issues to `[{ field, message }]`:

- `field` is a dot path (`groom.firstName`, `members.1.firstName`), an empty
  string for an error of the whole body.
- Only the **first** error per field is kept.
- A completely missing key is reported by Valibot on the object with an English
  message – the conversion replaces it with `Vyplňte toto pole` ("Fill in this field").

The backend builds `400 ValidationError` from it, the frontend an `ApiError`
with the same `details`; `ApiError.fieldErrors` is a `field → message` map for forms.

## Domain and schemas

- Domain objects accept the **output types** of schemas (`GuestInput`), never
  `unknown` – parsing happened in the endpoint.
- Value objects that are an invariant on their own (`EmailAddress`, user display
  name) re-validate with **the same schema** (`v.safeParse`) and throw
  `DomainError.field(...)` on failure. This also covers calls outside HTTP.

## Pitfalls

- `v.record(picklist, …)` makes keys optional in the type – for a "value for
  every category" breakdown compose `v.object` from the enum (see `BudgetSummarySchema`).
- `v.isoDate` does not check that the day exists (`2026-02-31` passes) – use `optionalIsoDate`.
- The birth year is checked against the current year at parse time.

## Related

- [Endpoints](endpoints.md)
- [Domain architecture](domains.md)
