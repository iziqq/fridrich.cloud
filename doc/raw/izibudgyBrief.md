# 💰 IziBudgy – household budget

> Translated from the Czech original; the Czech text is in git history (commit 8db5e0a, file doc/izibudgy.md).

> **Status: TODO.** Only a brief and a rough direction so far. The specification
> will be written after the portal and IziWeddy are finished.

An application for a household budget – an overview of income, expenses and savings.

| | |
|---|---|
| **Address** | `www.fridrich.cloud/izi-budgy` |
| **API module** | `/api/budgy/*` |
| **Frontend** | `apps/portal/src/budgy` – a subtree of the portal, same as [IziWeddy](iziweddy.md) |
| **Shared types** | `packages/budgy-shared` |
| **Identity** | Shared `fridrich.cloud` account – see [architecture.md, ch. 5](architecture.md#5-identita-registrace-a-přihlášení) |

---

## Rough direction

Expected core of the application – **to be confirmed and elaborated**:

- **Household** – a unit that can be shared by several users.
- **Accounts** – current account, savings account, cash.
- **Categories** – housing, food, transport, children, entertainment…
- **Transactions** – income / expense, amount, date, category, account, note.
- **Recurring payments** – rent, utilities, subscriptions; recurrence and reminders.
- **Monthly budget** – planned amount per category vs. actual spending.
- **Reports** – development over time, breakdown by category, balance.

## Questions to answer before writing the specification

| # | Question |
|---|---|
| 1 | Is everything entered manually, or should a bank statement be imported (CSV / bank API)? |
| 2 | Is the budget shared by several people (partners), or is it a single-user application? |
| 3 | Only one currency (CZK), or multiple currencies? |
| 4 | Are loans and instalments needed, or are income and expenses enough? |
| 5 | Are savings goals handled ("60,000 CZK for a holiday")? |
| 6 | How far back should history and reports be calculated? |

Once there are answers, a document with the same structure as
[iziweddy.md](iziweddy.md) will be created – domain model, functional
specification, REST API, validation rules, data storage.
