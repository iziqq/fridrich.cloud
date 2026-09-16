---
title: weddy / wedding – plans and the couple
type: domain
sources:
  - raw/iziweddySpec.md (ch. 4, 5.1, 5.2, 8)
  - raw/2026-09-16-weddyDashboard.md
  - code: packages/weddy-shared/src/wedding.ts, apps/api/src/domain/weddy/wedding, apps/portal/src/weddy/wedding
updated: 2026-09-16
---

# `weddy / wedding` – plans and the couple

> Root of the weddy domain. The `Wedding` aggregate holds the title, date, **groom
> and bride** (value objects `Person`) and the list of owners. The other
> subdomains refer to it via `weddingId` and check access through it.

## Features

**Dashboard** (`/izi-weddy`, `DashboardView.vue`) has three shapes, because a
list with a single card is a signpost to nowhere:

| Plans | What is shown | Component |
|---|---|---|
| 0 | Welcome screen: ring mark, heading, one sentence about the planner, a prominent *Založit plánování* (Create a wedding plan) button and four tiles with the sections – the same four the wedding detail has as tabs, so navigation is familiar afterwards. | `DashboardWelcome.vue` |
| 1 | Large summary of that wedding: title, couple, date with the countdown pill, three stat tiles (guests accepted / invited, budget total, sections decided with a progress bar) and four quick links to the tabs. Below it a quiet *Přidat další plánování* (Add another plan) link. | `WeddingOverview.vue` |
| 2+ | Grid of cards – title, countdown, couple, date, guests and budget; one column on mobile, two from tablet. A primary *Přidat plánování* button below. | `DashboardView.vue` |

The page heading (`h1`) belongs to the welcome screen or the summary; the header
shows the plain list title only for two plans and more, so a screen never has
two headings.

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
- `decidedSectionCount` = planning sections with at least one accepted item
  (`countDecidedSections` in the shared kernel, out of `PLANNING_CATEGORIES.length`).
  A rough measure of progress; like the budget it is calculated, never stored.

## Endpoints

| Endpoint | Method and path | Request → Response |
|---|---|---|
| `listWeddings` | `GET /api/weddy/weddings` | → `WeddingSummary[]` (Wedding + `guestCount`, `acceptedGuestCount`, `budgetTotal`, `decidedSectionCount`, `daysUntilWedding?`) |
| `createWedding` | `POST /api/weddy/weddings` | `WeddingInput` → `201 Wedding` |
| `getWedding` | `GET /api/weddy/weddings/{weddingId}` | → `Wedding` |
| `updateWedding` | `PUT /api/weddy/weddings/{weddingId}` | `WeddingInput` → `Wedding` |
| `deleteWedding` | `DELETE /api/weddy/weddings/{weddingId}` | → `204` |

## Code

| Layer | File |
|---|---|
| Shared kernel | `packages/weddy-shared/src/wedding.ts` – `PersonSchema`, `PersonInputSchema`, `WeddingSchema`, `WeddingInputSchema`, `WeddingSummarySchema`, `daysUntil` |
| Domain | `apps/api/src/domain/weddy/wedding/Wedding.ts`, `WeddingRepository.ts` |
| Use cases | `apps/api/src/application/weddy/wedding.ts` – `loadWeddingFor`, `listWeddings`, `getWedding`, `createWedding`, `updateWedding`, `deleteWedding`, `eraseUserWeddyData` (account deletion: sole-owner weddings deleted with guests and items, shared ones only `removeOwner`) |
| BE endpoints | `apps/api/src/endpoints/weddy/wedding/` |
| FE endpoints | `apps/portal/src/weddy/wedding/endpoints/` |
| Store | `wedding.store.ts` – `summaries`, `current`, `loadList`, `loadOne`, `create`, `update`, `remove` |
| UI | `DashboardView` (three shapes above), `DashboardWelcome`, `WeddingOverview`, `WeddingNewView`, `CoupleView`, `WeddingForm`, `WeddingLayout` (loads `current` for the header) |
| Formatting | `weddingFormats.ts` – `formatDate` and `countdown` shared by the dashboard and the summary |
| Storage | container `weddings`, PK `/id` |

## Related

- [weddy](weddy.md) · [guests](weddyGuests.md) · [planning](weddyPlanning.md) · [budget](weddyBudget.md)
- Why there is no separate `couple` subdomain: [domains.md](../architecture/domains.md#weddy-subdomains)
