---
title: weddy / planning – sections and items
type: domain
sources:
  - raw/iziweddySpec.md (ch. 4.2, 5.4, 7.3, 8)
  - code: packages/weddy-shared/src/planning.ts, apps/api/src/domain/weddy/planning, apps/portal/src/weddy/planning
updated: 2026-09-15
---

# `weddy / planning` – preparation sections and items

> Eleven fixed preparation sections. Each holds any number of **items** –
> vendor options being decided between. An item may have a link and a price and
> is either a draft or accepted.

## Sections (`PlanningCategory`, order = `PLANNING_CATEGORIES`)

| # | Value | UI label |
|---|---|---|
| 1 | `ceremonyVenue` | Místo obřadu (ceremony venue) |
| 2 | `receptionVenue` | Místo veselky (reception venue) |
| 3 | `food` | Jídlo (food) |
| 4 | `drinks` | Pití (drinks) |
| 5 | `flowers` | Květiny (flowers) |
| 6 | `decorations` | Výzdoba (decorations) |
| 7 | `suit` | Oblek (suit) |
| 8 | `dress` | Šaty (dress) |
| 9 | `rings` | Prstýnky (rings) |
| 10 | `bachelorParty` | Rozlučka (bachelor / bachelorette party) |
| 11 | `otherActivities` | Další aktivity (other activities) |

The order is thematic, not alphabetical: food and drinks follow the reception
venue they belong to, rings follow suit and dress. Section icons are in
`PlanningView.vue` (typed by the enum, a new section without an icon fails typecheck).

> ⚠️ The original specification listed 8 sections; 11 apply (`food`, `drinks`, `rings` were added).

## Item

| Field | Rule | Default (domain) |
|---|---|---|
| `category` | one of the 11 sections | |
| `name` | required, 1–200 | |
| `url` | optional, only `http://` / `https://`, max. 2000; opens in a new tab | |
| `price` | optional, number 0 – 100,000,000 CZK, **rounded to whole crowns** | |
| `status` | `draft` (Návrh – draft) / `accepted` (Schváleno – accepted) | `draft` |

- The price is optional on purpose – until a vendor sends a quote, the item has
  no price and the budget counts it as "without price".
- A section may contain several accepted items (open question, allowed for now).

## Features

- Section overview: for each section the number of items, number of accepted
  items and sum of prices (computed by `planning.store` via `calculateBudget`, no API call).
- Section detail: add, edit, delete an item, toggle status by click (optimistic).

## Endpoints

| Endpoint | Method and path | Request → Response |
|---|---|---|
| `listPlanningItems` | `GET …/items` | query `category?` → `PlanningItem[]` |
| `createPlanningItem` | `POST …/items` | `PlanningItemInput` → `201 PlanningItem` |
| `updatePlanningItem` | `PUT …/items/{itemId}` | `PlanningItemInput` → `PlanningItem` |
| `changePlanningItemStatus` | `PATCH …/items/{itemId}/status` | `{ status }` → `PlanningItem` |
| `deletePlanningItem` | `DELETE …/items/{itemId}` | → `204` |

Prefix `…` = `/api/weddy/weddings/{weddingId}`.

## Code

| Layer | File |
|---|---|
| Shared kernel | `packages/weddy-shared/src/planning.ts` – enums and labels, `PlanningItemSchema`, `PlanningItemInputSchema` |
| Domain | `apps/api/src/domain/weddy/planning/PlanningItem.ts`, `PlanningItemRepository.ts` |
| Use cases | `apps/api/src/application/weddy/planning.ts` |
| Endpoints | `apps/api/src/endpoints/weddy/planning/`, `apps/portal/src/weddy/planning/endpoints/` |
| Store | `planning.store.ts` – `items`, `budget` (section totals), `overview`, `byCategory`, `load`, `create`, `update`, `setStatus`, `remove` |
| UI | `PlanningView.vue`, `PlanningCategoryView.vue` |
| Storage | container `planningItems`, PK `/weddingId` |

## Related

- [weddy](weddy.md) · [budget](weddyBudget.md)
