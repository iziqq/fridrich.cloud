---
title: budgy domain – IziBudgy
type: domain
sources:
  - raw/izibudgyBrief.md
  - raw/2026-09-17-budgyStart.md
  - code: packages/budgy-shared, apps/api/src/domain/budgy, apps/portal/src/budgy
updated: 2026-09-17
---

# `budgy` domain – IziBudgy, the household budget

> A budget by months: **income**, **recurring expenses** that carry over on
> their own, and **one-off expenses** with a date. The month is never stored –
> it is always calculated from the entries, the same way the IziWeddy budget is.

| | |
|---|---|
| **Address** | `www.fridrich.cloud/izi-budgy` |
| **API** | `/api/budgy/*` |
| **Frontend** | `apps/portal/src/budgy/<subdomain>/` |
| **Shared kernel** | `packages/budgy-shared` |
| **Identity** | shared account – [identity.md](identity.md) |

## Subdomains

| Subdomain | What it holds | Page |
|---|---|---|
| `entries` | The entries themselves – income and expenses, recurring and one-off | [budgyEntries.md](budgyEntries.md) |
| `budget` | The month on screen: numbers, charts, browsing between months | [budgyBudget.md](budgyBudget.md) |

`budget` is a derived view, not an aggregate: it has no container of its own,
it only adds up `entries`. The split follows [domains.md](../architecture/domains.md) –
the same names are used in the shared kernel, the API and the portal.

## Decisions of the first version

| Question | Answer | Why |
|---|---|---|
| Months, or one running budget? | **Months with history** | "How much did we spend last month" is the whole point of a budget; a single list cannot answer it. |
| Shared with the household? | **One account for now** | Roles and invitations are a product of their own (see [weddyAccess.md](weddyAccess.md)); the model does not have to change to add them later. |
| Categories | **A fixed list** | Colours in the chart, translations and statistics come for free and there is nothing for the user to manage. |

Still open (from the older brief): importing bank statements, several
currencies, loans and instalments, savings goals.

## Personal data

A household budget is sensitive, so the product sits **inside the
`PERSONAL_DATA_COLLECTION_ENABLED` switch** on both sides (endpoints in
`personalDataEndpoints`, routes in `personalDataRoutes`), the privacy policy has
its own row for IziBudgy, and `eraseUserBudgyData` is registered as a
`UserDataEraser`, so deleting the account takes the budget with it. Details:
[personalData.md](../architecture/personalData.md).

## Look

Its own palette under the `.budgy` class (`budgy/budgy.css`): cool green,
plenty of white, `tabular-nums` for amounts so that columns of figures do not
wobble. Buttons, cards and dropdowns are shared with IziWeddy
([frontend.md](../architecture/frontend.md#product-ui-kit)) and are drawn only
from tokens, which each product redefines.

## Related

- [budgy / entries](budgyEntries.md) · [budgy / budget](budgyBudget.md)
- [Domain architecture](../architecture/domains.md) · [personal data](../architecture/personalData.md)
- Source: [raw/2026-09-17-budgyStart.md](../../raw/2026-09-17-budgyStart.md)
