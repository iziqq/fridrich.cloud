---
title: weddy / budget – the budget
type: domain
sources:
  - raw/iziweddySpec.md (ch. 5.5, 7.4)
  - code: packages/weddy-shared/src/budget.ts, apps/api/src/application/weddy/budget.ts, apps/portal/src/weddy/budget
updated: 2026-09-15
---

# `weddy / budget` – the budget

> The budget **adds up the prices of all planning items**. It is never stored,
> always calculated from the current items. It has no aggregate or container of
> its own – it is a derived view over the `planning` subdomain.

## Values

| Value | Calculation |
|---|---|
| `total` | sum of prices of all items |
| `accepted` | sum of prices of `accepted` items |
| `draft` | sum of prices of `draft` items |
| `itemsWithoutPrice` | number of items without a price – a warning that the total may be incomplete |
| `byCategory[section]` | the same for each of the 11 sections (the key is always present, even with zeros) |

Items without a price are not included in the sums (count as 0), only in `itemsWithoutPrice`.

## Where it is calculated

The single implementation is `calculateBudget(items)` in the shared kernel:

- **Backend** – the `getBudget` endpoint (use case `application/weddy/budget.ts`)
  loads the items and calls it.
- **Frontend – Budget screen** (`BudgetView.vue`) calls the `getBudget` endpoint
  every time it opens; it shares no state, so it has no store.
- **Frontend – section overview** in planning calculates totals locally with the
  same function from the items in `planning.store`, so they update instantly after an edit.

Because there is one calculation, the numbers in both places cannot disagree.

## Screen

Total in large type, accepted/draft bar, breakdown by section (only sections
with a price or an item without one, linking to the section), a warning about
items without a price, an empty state linking to planning.

## Endpoint

| Endpoint | Method and path | Response |
|---|---|---|
| `getBudget` | `GET /api/weddy/weddings/{weddingId}/budget` | `BudgetSummary` |

```json
{
  "total": 185000, "accepted": 120000, "draft": 65000, "itemsWithoutPrice": 2,
  "byCategory": {
    "ceremonyVenue": { "total": 45000, "accepted": 45000, "draft": 0, "itemsWithoutPrice": 0 },
    "flowers": { "total": 15000, "accepted": 0, "draft": 15000, "itemsWithoutPrice": 1 }
  }
}
```
*(shortened example – `byCategory` contains all 11 sections)*

## Code

| Layer | File |
|---|---|
| Shared kernel | `packages/weddy-shared/src/budget.ts` – `BudgetBreakdownSchema`, `BudgetSummarySchema`, `calculateBudget`, `formatCurrency` |
| Use case | `apps/api/src/application/weddy/budget.ts` |
| Endpoints | `apps/api/src/endpoints/weddy/budget/getBudget.endpoint.ts`, `apps/portal/src/weddy/budget/endpoints/getBudget.endpoint.ts` |
| UI | `apps/portal/src/weddy/budget/BudgetView.vue` |

## Related

- [planning](weddyPlanning.md) · [weddy](weddy.md)
- Possible extensions: budget target (how much is left), deposits and payments.
