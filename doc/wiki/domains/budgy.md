---
title: budgy domain – IziBudgy (TODO)
type: domain
sources:
  - raw/izibudgyBrief.md
updated: 2026-09-15
---

# `budgy` domain – IziBudgy, household budget

> **Status: TODO.** Only a rough brief. The specification will be written once
> the owner answers the questions below; implementation will then follow the
> same pattern as [weddy](weddy.md).

| | |
|---|---|
| **Address** | `www.fridrich.cloud/izi-budgy` |
| **API** | `/api/budgy/*` |
| **Frontend** | `apps/portal/src/budgy/<subdomain>/` |
| **Shared kernel** | `packages/budgy-shared` (to be created) |
| **Identity** | shared account – [identity.md](identity.md) |

## Expected core (unconfirmed)

Candidate subdomains: **household** (shared by several users), **accounts**
(current, savings, cash), **categories**, **transactions** (income/expense),
**recurring payments**, **monthly budget** (plan vs. actual), **reports**.

## Questions before the specification

| # | Question |
|---|---|
| 1 | Manual entry, or bank statement import (CSV / bank API)? |
| 2 | Is the budget shared by several people, or single-user? |
| 3 | CZK only, or multiple currencies? |
| 4 | Loans and instalments, or just income and expenses? |
| 5 | Savings goals ("60,000 CZK for a holiday")? |
| 6 | How far back should history and reports go? |

## When work starts

1. Answers → a new source in `doc/raw/` → ingest into this page and subdomain pages.
2. `packages/budgy-shared` with schemas according to [valibot.md](../architecture/valibot.md).
3. Domain, use cases and endpoints according to [endpoints.md](../architecture/endpoints.md).
4. Containers in the shared `izi-db` database (limit 25 containers) – [dataCosmos.md](../architecture/dataCosmos.md).
