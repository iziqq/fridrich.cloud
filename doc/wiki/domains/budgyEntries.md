---
title: budgy / entries – income and expenses
type: domain
sources:
  - raw/2026-09-17-budgyStart.md
  - raw/2026-09-17-budgyDashboard.md
  - raw/2026-09-17-weddyPaymentsToBudgy.md
  - code: packages/budgy-shared/src/entries.ts, apps/api/src/domain/budgy/entry, apps/portal/src/budgy/budget
updated: 2026-09-17
---

# `budgy / entries` – income and expenses

> One entry is an income, an expense or an **investment**, and is either
> **recurring** (the same every month – mortgage, salary, subscription) or
> **one-off** (a purchase with a date). Everything the budget shows is derived
> from these.

## Fields

| Field | Rule |
|---|---|
| `kind` | `income` (Příjem) / `expense` (Výdaj) / `investment` (Investice) |
| `recurrence` | `monthly` (Pravidelná) / `once` (Jednorázová) |
| `name` | required, 1–100 |
| `amount` | 1 – 100,000,000 CZK, whole crowns, **always positive** – the direction is the `kind` |
| `category` | required for an expense, one of the 11 categories; income has none |
| `date` | required for a one-off entry (`YYYY-MM-DD`, the day must exist) |
| `startsOn`, `endsOn` | a recurring entry: from which month it applies and optionally until which (`YYYY-MM`) |
| `note` | optional, max. 500 |
| `source` | only on entries written by another app: `{ app, ref, part, path }` – see below |

Income and investments deliberately have **no category**: the brief asks for
income as a list of entries, and one more enum would be a field to fill in with
nothing to answer.

**An investment is a third kind, not an expense category.** The money leaves the
account, so it lowers what is left over, but it is not spent – it only changes
form. As a category it would inflate both the donut and the answer to "how much
does this month cost"; as a separate kind it has its own colour, its own section
and its own total.

## Categories (`EXPENSE_CATEGORIES`)

| # | Value | UI label |
|---|---|---|
| 1 | `housing` | Bydlení (housing) |
| 2 | `insurance` | Pojištění (insurance) |
| 3 | `connectivity` | Telefon a internet (phone and internet) |
| 4 | `subscriptions` | Předplatné (subscriptions) |
| 5 | `transport` | Doprava (transport) |
| 6 | `food` | Jídlo (food) |
| 7 | `household` | Domácnost (household) |
| 8 | `entertainment` | Zábava (entertainment) |
| 9 | `health` | Zdraví (health) |
| 10 | `children` | Děti (children) |
| 11 | `wedding` | Svatba (wedding) – paid payments from IziWeddy |
| 12 | `other` | Ostatní (other) |

The order goes from the roof over one's head to the small things – that is how
a budget is read. Category colours are in `budgy/categoryColors.ts`, typed by
the enum, so a new category without a colour fails typecheck.

## Rules

- **The month is not a record.** A recurring entry carries a range, a one-off
  one a date, so the view of any month is computed from the same data
  (`appliesTo`, `entriesForMonth`). Nothing has to be copied forward and last
  month cannot silently change.
- A recurring entry **starts in the month it was created** unless a start is
  given. Applying it backwards would rewrite history the user never entered.
- Changing an amount applies to **every month**, past included. To keep history
  intact, the entry is **ended** (`endsOn`) and a new one is created – that is
  what the *Platí do* (Valid until) field is for.
- Changing the recurrence drops the fields of the other kind (`detailsFrom`):
  otherwise an entry could keep both a date and a range and count twice.
- Conditional rules are in the **schema**, not the domain
  (`v.forward(v.check(…), [field])`), so the error lands on the field the form
  can show it at: an expense needs a category, a one-off entry needs a date, the
  end cannot precede the start.
- The budget belongs to **one account**. Every use case works with `userId`, so
  someone else's entry cannot even be read (`notFound`, not `forbidden` – a
  stranger should not learn that the id exists).

## Entries written by another app

IziWeddy writes paid deposits and payments into the plan admin's budget
([weddyPlanning.md](weddyPlanning.md#paid-payments-in-izibudgy)). Such an entry
carries a `source`:

| Field | Meaning |
|---|---|
| `app` | `weddy` |
| `ref` | the thing in that app, e.g. `wedding:w1:item:i2` – how the entry is found again |
| `part` | `deposit`, `rest` or `full` – one thing can have two payments |
| `path` | where in the portal the entry links to |

- The shape is **generic on purpose**: the budget does not know what a bundle
  or a deposit is, only that an entry came from somewhere else.
- **The user cannot update or delete it** in the budget (`conflict`,
  `entryManaged`): a change would last only until the next save in Weddy and a
  deleted entry would come back. The screen shows *Spravuje IziWeddy ↗* (Managed
  in IziWeddy) instead of the edit buttons.
- When the source disappears the entry is **released** – `source` is removed
  and it becomes an ordinary, editable expense.
- `recordExternalPayments` / `releaseExternalPayments`
  (`application/budgy/externalPayments.ts`) implement weddy's `PaymentLedger`;
  the repository finds entries by reference **across accounts**
  (`listBySourceRef`), because the admin may have changed since the entry was
  written.

## Endpoints

| Endpoint | Method and path | Request → Response |
|---|---|---|
| `listBudgetEntries` | `GET /api/budgy/entries` | → `BudgetEntry[]` (all entries of the account) |
| `createBudgetEntry` | `POST /api/budgy/entries` | `BudgetEntryInput` → `201 BudgetEntry` |
| `updateBudgetEntry` | `PUT /api/budgy/entries/{entryId}` | `BudgetEntryInput` → `BudgetEntry` |
| `deleteBudgetEntry` | `DELETE /api/budgy/entries/{entryId}` | → `204` |

The list returns **everything**, not one month: recurring entries apply across
months and both browsing backwards and the six-month chart would otherwise be a
request per month. A household enters a few dozen entries a year, so the payload
stays small; if it ever grows, the place to paginate is here.

## Code

| Layer | File |
|---|---|
| Shared kernel | `packages/budgy-shared/src/entries.ts` – enums and labels, `BudgetEntrySchema`, `BudgetEntryInputSchema`, `MonthSchema`, `appliesTo`, `entriesForMonth`, `monthOf`, `shiftMonth` |
| Domain | `apps/api/src/domain/budgy/entry/BudgetEntry.ts`, `BudgetEntryRepository.ts` |
| Use cases | `apps/api/src/application/budgy/entries.ts` – `listEntries`, `createEntry`, `updateEntry`, `deleteEntry`, `eraseUserBudgyData` |
| Endpoints | `apps/api/src/endpoints/budgy/entries/`, `apps/portal/src/budgy/budget/endpoints/` |
| UI | `EntrySheet.vue` (the form) |
| Storage | container `budgetEntries`, PK `/userId` |

## Related

- [budgy](budgy.md) · [budget](budgyBudget.md)
- [Valibot rules](../architecture/valibot.md) · [personal data](../architecture/personalData.md)
