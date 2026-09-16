---
title: weddy / planning – sections and items
type: domain
sources:
  - raw/iziweddySpec.md (ch. 4.2, 5.4, 7.3, 8)
  - raw/2026-09-16-planningBundles.md
  - code: packages/weddy-shared/src/planning.ts, apps/api/src/domain/weddy/planning, apps/portal/src/weddy/planning
updated: 2026-09-16
---

# `weddy / planning` – preparation sections and items

> Twelve fixed preparation sections. Each holds any number of **items** –
> vendor options being decided between. An item may have a link and a price and
> is either a draft or accepted. A **bundle** is one offer for one price that
> covers items across several sections.

## Sections (`PlanningCategory`, order = `PLANNING_CATEGORIES`)

| # | Value | UI label |
|---|---|---|
| 1 | `ceremonyVenue` | Místo obřadu (ceremony venue) |
| 2 | `receptionVenue` | Místo veselky (reception venue) |
| 3 | `food` | Jídlo (food) |
| 4 | `drinks` | Pití (drinks) |
| 5 | `flowers` | Květiny (flowers) |
| 6 | `decorations` | Výzdoba (decorations) |
| 7 | `music` | Hudba (music) |
| 8 | `suit` | Oblek (suit) |
| 9 | `dress` | Šaty (dress) |
| 10 | `rings` | Prstýnky (rings) |
| 11 | `bachelorParty` | Rozlučka (bachelor / bachelorette party) |
| 12 | `otherActivities` | Další aktivity (other activities) |

The order is thematic, not alphabetical: food and drinks follow the reception
venue they belong to, rings follow suit and dress. Section icons are in
`planning/categoryIcons.ts` (typed by the enum, a new section without an icon
fails typecheck) and are shared by the planning overview and the list inside a
bundle, so the same section looks the same everywhere.

> ⚠️ The original specification listed 8 sections; 12 apply (`food`, `drinks`,
> `rings` and, on 2026-09-16, `music` were added). `music` came from the bundle
> brief: a venue offering a band had nowhere to put it.

## Item

| Field | Rule | Default (domain) |
|---|---|---|
| `category` | one of the 12 sections | |
| `name` | required outside a bundle, 1–200; **an item inside a bundle has none** | |
| `url` | optional, only `http://` / `https://`, max. 2000; opens in a new tab | |
| `price` | optional, number 0 – 100,000,000 CZK, **rounded to whole crowns** | |
| `status` | `draft` (Návrh – draft) / `accepted` (Schváleno – accepted) | `draft` |
| `bundleId` | optional – the bundle that includes the item | |

- The price is optional on purpose – until a vendor sends a quote, the item has
  no price and the budget counts it as "without price".
- A section may contain several accepted items (open question, allowed for now).
- An item **in a bundle has neither its own price nor its own status**: the
  bundle carries both. Its stored `status` stays untouched and applies again
  once the item leaves the bundle (`itemStatus(item, bundles)`).
- An item created inside a bundle has **no name either** – there it only says
  "this section is included", so it is shown under the bundle's name
  (`itemTitle(item, bundles)`). The rule lives in `PlanningItemInputSchema` as a
  `v.forward(v.check(…), ['name'])`, not in the domain, so the error lands on
  the `name` field and the form can show it.

## Bundle

One offer for one price that covers several items – a venue that includes the
ceremony, the reception, food, drinks and the band.

| Field | Rule |
|---|---|
| `name` | required, 1–200 |
| `url` | optional, `http(s)://`, max. 2000 |
| `price` | optional, 0 – 100,000,000 CZK, whole crowns – **one price for everything** |
| `status` | `draft` / `accepted`, default `draft` |

- **A bundle does not hold a list of its items – an item holds its `bundleId`.**
  Moving an item is then one document write and the list cannot drift from
  reality. The sections a bundle covers are always derived from its items
  (`bundleCategories`).
- The bundle is approved **as a whole**: its status applies to every item in it,
  so the section detail shows the bundle's status and does not let the item be
  toggled on its own.
- **Deleting a bundle keeps its items** and only frees them (`leaveBundle`).
  They are real things to arrange – the band does not disappear when the offer
  falls through, it only has no price again.
- An item can only join a bundle of **the same wedding** (checked in the use
  case) – otherwise a guessed `bundleId` could pull a price from another
  wedding into this budget.
- Inside a bundle **only the section is entered** (`PlanningBundleView.vue`):
  the name, the link and the price belong to the whole offer, so there is
  nothing else to fill in. The same section cannot be added twice – the picker
  only offers the ones that are free.
- An item that already exists is moved into a bundle through the *Balíček*
  (Bundle) picker in the item form and **keeps its own name and link**; the
  section detail then shows both, the bundle detail shows them under the section.

## Features

- Section overview: **Balíčky** (Bundles) block on top – each bundle with its
  price, status and the sections it covers – and below it the sections with the
  number of items, accepted items, items covered by a bundle and the sum of
  prices (computed by `planning.store` via `calculateBudget`, no API call).
- Section detail: add, edit, delete an item, toggle status by click (optimistic).
  An item in a bundle shows *v balíčku X* (in the bundle X) linking to it,
  instead of a price.
- Bundle detail (`/planning/bundles/{bundleId}`): the offer with its price and
  status, and *Co je v ceně* (What is included) – one row per section, in the
  order of the enum.

## Endpoints

| Endpoint | Method and path | Request → Response |
|---|---|---|
| `listPlanningItems` | `GET …/items` | query `category?` → `PlanningItem[]` |
| `createPlanningItem` | `POST …/items` | `PlanningItemInput` → `201 PlanningItem` |
| `updatePlanningItem` | `PUT …/items/{itemId}` | `PlanningItemInput` → `PlanningItem` |
| `changePlanningItemStatus` | `PATCH …/items/{itemId}/status` | `{ status }` → `PlanningItem` |
| `deletePlanningItem` | `DELETE …/items/{itemId}` | → `204` |
| `listPlanningBundles` | `GET …/bundles` | → `PlanningBundle[]` |
| `createPlanningBundle` | `POST …/bundles` | `PlanningBundleInput` → `201 PlanningBundle` |
| `updatePlanningBundle` | `PUT …/bundles/{bundleId}` | `PlanningBundleInput` → `PlanningBundle` |
| `changePlanningBundleStatus` | `PATCH …/bundles/{bundleId}/status` | `{ status }` → `PlanningBundle` |
| `deletePlanningBundle` | `DELETE …/bundles/{bundleId}` | → `204` (items stay, freed from the bundle) |

Prefix `…` = `/api/weddy/weddings/{weddingId}`.

## Code

| Layer | File |
|---|---|
| Shared kernel | `packages/weddy-shared/src/planning.ts` – enums and labels, `PlanningItemSchema`, `PlanningItemInputSchema`, `PlanningBundleSchema`, `PlanningBundleInputSchema`, `itemStatus`, `bundleCategories`, `countDecidedSections` |
| Domain | `apps/api/src/domain/weddy/planning/PlanningItem.ts`, `PlanningBundle.ts`, their repositories |
| Use cases | `apps/api/src/application/weddy/planning.ts` (items and bundles) |
| Endpoints | `apps/api/src/endpoints/weddy/planning/`, `apps/portal/src/weddy/planning/endpoints/` |
| Store | `planning.store.ts` – `items`, `bundles`, `budget` (section totals), `overview`, `byCategory`, `statusOf`, `bundleOf`, `itemsInBundle`, `load`, `create`, `update`, `setStatus`, `remove`, `addBundle`, `editBundle`, `setBundleStatus`, `removeBundle` |
| UI | `PlanningView.vue`, `PlanningCategoryView.vue`, `PlanningBundleView.vue`, `BundleSheet.vue` |
| Storage | containers `planningItems` and `planningBundles`, both PK `/weddingId` |

## Related

- [weddy](weddy.md) · [budget](weddyBudget.md)
