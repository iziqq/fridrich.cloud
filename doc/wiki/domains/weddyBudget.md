---
title: weddy / budget – the budget
type: domain
sources:
  - raw/iziweddySpec.md (ch. 5.5, 7.4)
  - raw/2026-09-16-planningBundles.md
  - code: packages/weddy-shared/src/budget.ts, apps/api/src/application/weddy/budget.ts, apps/portal/src/weddy/budget
updated: 2026-09-16
---

# `weddy / budget` – the budget

> The budget **adds up the prices of all planning items and bundles**. It is
> never stored, always calculated from the current items. It has no aggregate or container of
> its own – it is a derived view over the `planning` subdomain.

## Values

| Value | Calculation |
|---|---|
| `total` | sum of prices of all standalone items **and of every bundle, counted once** |
| `accepted` | the same for `accepted` items and bundles |
| `draft` | the same for `draft` items and bundles |
| `itemsWithoutPrice` | items and bundles without a price – a warning that the total may be incomplete |
| `bundleItems` | items whose price is carried by a bundle |
| `byCategory[section]` | the same for each of the 12 sections (the key is always present, even with zeros) |
| `bundles[]` | each bundle with its price, status, the sections it covers and the number of items |

Items without a price are not included in the sums (count as 0), only in `itemsWithoutPrice`.

**Bundles** ([planning](weddyPlanning.md#bundle)) are the one place where the
section breakdown does not add up to the total, on purpose:

- an item in a bundle contributes **nothing** to the sums – its price is in the
  bundle, and counting both would pay for one thing twice; the section only
  counts it in `bundleItems`, so it is visible that the section is not empty,
- the bundle price is **not split between the sections it covers**. One price
  for the ceremony, the food and the band cannot be divided between them
  without inventing numbers, so the budget screen lists the bundles in their own
  block above the breakdown and says why.

## Where it is calculated

The single implementation is `calculateBudget(items, bundles)` in the shared kernel:

- **Backend** – the `getBudget` endpoint (use case `application/weddy/budget.ts`)
  loads the items and the bundles and calls it.
- **Frontend – Budget screen** (`BudgetView.vue`) calls the `getBudget` endpoint
  every time it opens; it shares no state, so it has no store.
- **Frontend – section overview** in planning calculates totals locally with the
  same function from the items in `planning.store`, so they update instantly after an edit.

Because there is one calculation, the numbers in both places cannot disagree.

## Screen

Total in large type, accepted/draft bar, the **Balíčky** (Bundles) block with a
one-line explanation of why a bundle is not in the section breakdown, then the
breakdown by section (only sections with a price, an item without one or an item
in a bundle, each linking to the section), a warning about items without a
price, an empty state linking to planning.

## Endpoint

| Endpoint | Method and path | Response |
|---|---|---|
| `getBudget` | `GET /api/weddy/weddings/{weddingId}/budget` | `BudgetSummary` |

```jsonc
{
  "total": 185000, "accepted": 120000, "draft": 65000,
  "itemsWithoutPrice": 2, "bundleItems": 5,
  "byCategory": {
    "ceremonyVenue": { "total": 0, "accepted": 0, "draft": 0, "itemsWithoutPrice": 0, "bundleItems": 1 },
    "flowers": { "total": 15000, "accepted": 0, "draft": 15000, "itemsWithoutPrice": 1, "bundleItems": 0 }
  },
  "bundles": [
    {
      "id": "b1", "name": "Zámek Dobříš – vše v jednom", "price": 120000, "status": "accepted",
      "categories": ["ceremonyVenue", "receptionVenue", "food", "drinks", "music"], "itemCount": 5
    }
  ]
}
```
*(shortened example – `byCategory` contains all 12 sections)*

## Code

| Layer | File |
|---|---|
| Shared kernel | `packages/weddy-shared/src/budget.ts` – `BudgetBreakdownSchema`, `BudgetBundleSchema`, `BudgetSummarySchema`, `calculateBudget(items, bundles)`, `formatCurrency` |
| Use case | `apps/api/src/application/weddy/budget.ts` |
| Endpoints | `apps/api/src/endpoints/weddy/budget/getBudget.endpoint.ts`, `apps/portal/src/weddy/budget/endpoints/getBudget.endpoint.ts` |
| UI | `apps/portal/src/weddy/budget/BudgetView.vue` |

## Related

- [planning](weddyPlanning.md) · [weddy](weddy.md)
- Possible extensions: budget target (how much is left), deposits and payments.
