---
title: Domain architecture
type: concept
sources:
  - raw/2026-09-15-domainArchitecture.md
  - code: apps/api/src, apps/portal/src, packages/*-shared
updated: 2026-09-16
---

# Domain architecture

> Backend and frontend are organised **by domain, not by technical layer**.
> A domain has the same name and the same subdomains in `apps/api`,
> `apps/portal` and the shared kernel `packages/*-shared`. Business logic always
> lives in the domain.

## Domain map

| Domain | Subdomains | Responsibility | API prefix |
|---|---|---|---|
| `identity` | – | Registration, passwordless login, sessions | `/api/auth/*` |
| `contact` | – | Portal contact form | `/api/contact` |
| `weddy` | `wedding`, `guests`, `planning`, `budget` | IziWeddy wedding planner | `/api/weddy/*` |
| `budgy` | *(TODO)* | IziBudgy household budget | `/api/budgy/*` |

The portal (presentation website) is not a business domain – it is content and
look, see [domains/portal.md](../domains/portal.md).

### `weddy` subdomains

| Subdomain | Content | Screens | Page |
|---|---|---|---|
| `wedding` | The `Wedding` aggregate – root of the whole domain: title, date, **the couple**, owners and access control. Dashboard. | Dashboard, New plan, Couple, wedding detail layout | [weddyWedding.md](../domains/weddyWedding.md) |
| `guests` | Guests and **families** (groups of guests), statistics | Guests | [weddyGuests.md](../domains/weddyGuests.md) |
| `planning` | Preparation sections and vendor items | Planning, Section detail | [weddyPlanning.md](../domains/weddyPlanning.md) |
| `budget` | Budget calculated from the items | Budget | [weddyBudget.md](../domains/weddyBudget.md) |
| `access` | Roles (admin / manager / viewer) and invitations by e-mail | Settings → Access | [weddyAccess.md](../domains/weddyAccess.md) |

> **Why the couple is not a separate `couple` subdomain:** the groom and bride
> have no identity or lifecycle of their own – they are value objects inside the
> `Wedding` aggregate, stored in one document and edited together with the
> title and date in one form through one endpoint (`PUT /weddings/{id}`). If
> the couple ever gets its own data or endpoints (sharing, profile),
> `weddy/couple` will be created following the same pattern.

## Where a domain lives

```
packages/weddy-shared/src/<subdomain>.ts      # shared kernel: schemas, enums, pure calculations
apps/api/src/
  domain/weddy/<subdomain>/                   # entities, domain functions, ports (repositories)
  application/weddy/<subdomain>.ts            # use cases: load → check access → domain → save
  endpoints/weddy/<subdomain>/*.endpoint.ts   # HTTP contract, 1 file = 1 endpoint
  infrastructure/cosmos/weddyRepositories.ts  # port implementations on Cosmos DB
apps/portal/src/weddy/<subdomain>/
  endpoints/*.endpoint.ts                     # API calls, 1 file = 1 endpoint
  <subdomain>.store.ts                        # Pinia – shared state of the subdomain (if needed)
  *View.vue, *.vue                            # screens and components of the subdomain
```

Domains without subdomains (`identity`, `contact`) have one level less:
`domain/identity/`, `endpoints/identity/`, `apps/portal/src/identity/`.

## Layers and where logic belongs

| What | Where | Example |
|---|---|---|
| Wire data shape, field rules (required, length, format, range) | Valibot schema in the shared kernel | `GuestInputSchema`, `PlanningItemInputSchema` |
| Pure calculations the frontend needs too | Shared kernel | `calculateBudget`, `calculateGuestStats`, `groupIntoFamilies` |
| Invariants and behaviour over state | Domain object / domain function | `Wedding.assertCanEdit`, `Guest.joinFamily`, `rewriteFamily`, `LoginCode.verify` |
| Default values, security rules | Domain | new guest is `draft` + `adult`; uniform login error |
| Orchestration (load, check access, call domain, save) | Use case in `application/` | `updateFamily` |
| HTTP: method, path, input parsing, status code, cookie | Endpoint file | `createGuest.endpoint.ts` |
| Cosmos DB, e-mails, cryptography | `infrastructure/` | `guestCosmosRepository` |
| Screen state, optimistic updates, filters and sorting | Frontend store / view | `useGuestsStore` |

The shared kernel (`packages/*-shared`) **is part of the domain**: whatever is
in it applies to both frontend and backend, and it must not depend on anything
in `apps/`, the database or the UI.

## Dependency rules

1. **Domains do not call each other.** The only thing they share is the user
   identity (`userId`) passed by the endpoint wrapper. If a domain grows, it can
   be cut out without touching the others. What one domain needs from another
   goes through a **port wired in `infrastructure/container.ts`**: identity calls
   `UserDataEraser` and `UserRegistrationListener` (account deleted, account
   created), weddy reads names and e-mails through `UserDirectory`. A cross-domain effect goes through a
   port owned by the triggering domain and wired in `infrastructure/container.ts` –
   account deletion calls `UserDataEraser`, implemented by `weddy`
   (`eraseUserWeddyData`) ([personalData.md](personalData.md#account-deletion-right-to-erasure)).
2. **`weddy` subdomains may depend on `wedding`** (the root) – every use case
   calls `loadWeddingFor()`, which checks access at the level it needs
   (`read` / `edit` / `settings`); the aggregate decides, never the endpoint. There are no direct
   dependencies between `guests`, `planning` and `budget`; `budget` reads
   planning items through the repository port, the frontend loads it via its
   own endpoint.
3. **Backend dependency direction:** `endpoints → application → domain ← infrastructure`.
   The domain knows nothing about HTTP, Azure Functions or the Cosmos SDK.
4. **Frontend:** view → store → endpoint file → `api/http.ts`. A component never
   calls `fetch` or `callEndpoint` directly, always through an endpoint file. A
   screen may call an endpoint without a store when it shares the result with
   nobody else (e.g. registration, budget).
5. **Composition, not inheritance** – no abstract classes between domain
   objects; shared behaviour is composed from functions and value objects.

## Related

- [Endpoints](endpoints.md) – the endpoint file convention on FE and BE
- [Valibot](valibot.md) – types and validation
- [Backend](backend.md), [Frontend](frontend.md)
- [Decisions](../decisions.md) – why the architecture looks like this
