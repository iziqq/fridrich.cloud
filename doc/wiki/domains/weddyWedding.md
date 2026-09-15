---
title: weddy / wedding – plans and the couple
type: domain
sources:
  - raw/iziweddySpec.md (ch. 4, 5.1, 5.2, 8)
  - code: packages/weddy-shared/src/wedding.ts, apps/api/src/domain/weddy/wedding, apps/portal/src/weddy/wedding
updated: 2026-09-15
---

# `weddy / wedding` – plans and the couple

> Root of the weddy domain. The `Wedding` aggregate holds the title, date, **groom
> and bride** (value objects `Person`) and the list of owners. The other
> subdomains refer to it via `weddingId` and check access through it.

## Features

**Dashboard** (overview only): cards of all the user's plans – title and names
of the couple, date and days until the wedding, guests total / accepted, total
budget. A "Přidat plánování" (Add plan) button, clicking a card opens the detail.

**Couple:** one form – a Wedding block (title, date) and Groom and Bride blocks
with the same fields. Creating a new plan uses the same form (`WeddingForm.vue`).

## Rules

| Field | Rule | Schema |
|---|---|---|
| `title` | required, 1–200 characters | `WeddingInputSchema` |
| `weddingDate` | optional, `YYYY-MM-DD`, the day must exist | `optionalIsoDate` |
| `groom`, `bride` | required objects | `PersonInputSchema` |
| `firstName`, `lastName` | required, 1–100 characters | |
| `birthYear` | optional, integer 1900 – current year | |
| `email` | optional, valid e-mail, lowercase | |
| `phone` | optional, max. 40 characters | |
| `note` | optional, max. 2000 characters | |

Domain:

- The creator is the only owner (`ownerIds = [userId]`); `shareWith` adds another
  one (no endpoint yet).
- `toPublic()` responses **never include `ownerIds`**.
- Deleting a wedding deletes its guests and items; the wedding is deleted
  **last** (Cosmos has no transactions – a crash midway can be retried).
- `daysUntilWedding` = whole days until the date (negative after the wedding), computed from `Clock`.

## Endpoints

| Endpoint | Method and path | Request → Response |
|---|---|---|
| `listWeddings` | `GET /api/weddy/weddings` | → `WeddingSummary[]` (Wedding + `guestCount`, `acceptedGuestCount`, `budgetTotal`, `daysUntilWedding?`) |
| `createWedding` | `POST /api/weddy/weddings` | `WeddingInput` → `201 Wedding` |
| `getWedding` | `GET /api/weddy/weddings/{weddingId}` | → `Wedding` |
| `updateWedding` | `PUT /api/weddy/weddings/{weddingId}` | `WeddingInput` → `Wedding` |
| `deleteWedding` | `DELETE /api/weddy/weddings/{weddingId}` | → `204` |

## Code

| Layer | File |
|---|---|
| Shared kernel | `packages/weddy-shared/src/wedding.ts` – `PersonSchema`, `PersonInputSchema`, `WeddingSchema`, `WeddingInputSchema`, `WeddingSummarySchema`, `daysUntil` |
| Domain | `apps/api/src/domain/weddy/wedding/Wedding.ts`, `WeddingRepository.ts` |
| Use cases | `apps/api/src/application/weddy/wedding.ts` – `loadWeddingFor`, `listWeddings`, `getWedding`, `createWedding`, `updateWedding`, `deleteWedding` |
| BE endpoints | `apps/api/src/endpoints/weddy/wedding/` |
| FE endpoints | `apps/portal/src/weddy/wedding/endpoints/` |
| Store | `wedding.store.ts` – `summaries`, `current`, `loadList`, `loadOne`, `create`, `update`, `remove` |
| UI | `DashboardView`, `WeddingNewView`, `CoupleView`, `WeddingForm`, `WeddingLayout` (loads `current` for the header) |
| Storage | container `weddings`, PK `/id` |

## Related

- [weddy](weddy.md) · [guests](weddyGuests.md) · [planning](weddyPlanning.md) · [budget](weddyBudget.md)
- Why there is no separate `couple` subdomain: [domains.md](../architecture/domains.md#weddy-subdomains)
