---
title: budgy / budget – the month on screen
type: domain
sources:
  - raw/2026-09-17-budgyStart.md
  - code: packages/budgy-shared/src/summary.ts, apps/portal/src/budgy/budget
updated: 2026-09-17
---

# `budgy / budget` – the month on screen

> The numbers of one month, two charts and the entries in three sections.
> Nothing is stored: the month is always computed from the entries
> ([entries](budgyEntries.md)), so no figure can drift from the data.

## Values (`summarizeMonth`)

| Value | Calculation |
|---|---|
| `income`, `expenses` | sums of the entries that apply in the month |
| `remaining` | `income − expenses`; a negative number means the month did not work out |
| `savedShare` | how much of the income is left, 0–1; zero without income (nothing is divided by zero) |
| `recurringIncome`, `oneOffIncome` | income split by recurrence |
| `recurringExpenses`, `oneOffExpenses` | the same for expenses – the two expense sections on screen |
| `byCategory[]` | only the categories something was spent on, sorted from the most expensive, each with its `share` of the month's expenses |

`monthlyTrend(entries, month, 6)` returns the last six months **including empty
ones** – closing a gap in the row would make the bars lie about what follows
what.

## Screen (`BudgetView.vue`)

| Block | What it does |
|---|---|
| Header | The month with `‹ ›` arrows; forward only up to the current month, plus a *Zpět na tento měsíc* (Back to this month) button. Nobody budgets next year. |
| Summary | Income, expenses and what is left, and two bars scaled to the larger of the two – when expenses outgrow income, it is visible by how much. |
| *Kam peníze jdou* (Where the money goes) | Expenses of the month as a **donut with a legend** – `ExpenseDonut.vue`. |
| *Posledních šest měsíců* (The last six months) | Pairs of bars, income against expenses – `TrendChart.vue`. Clicking a month switches the screen to it, so the chart is also navigation. |
| Entries | Three sections in the order a budget is read: *Příjmy* (Income), *Pravidelné výdaje* (Recurring expenses), *Jednorázové výdaje* (One-off expenses), each with its total and an add button. |

Both charts are drawn by hand – the donut as SVG arcs (`stroke-dasharray` for
the length of the arc, `stroke-dashoffset` for where it starts), the trend as
`div`s with a height in percent. A charting library would cost more than the
whole product's bundle and would not take colours and fonts from the product
tokens.

## Where it is calculated

The single implementation is `summarizeMonth` / `monthlyTrend` in the shared
kernel. The portal loads all entries once and computes every month locally, so
browsing between months is instant and no request is needed. The API does not
compute the summary at all – there is no `getSummary` endpoint, because the
numbers would be the same ones.

## Code

| Layer | File |
|---|---|
| Shared kernel | `packages/budgy-shared/src/summary.ts` – `MonthSummarySchema`, `CategoryShareSchema`, `summarizeMonth`, `monthlyTrend` |
| Store | `budget.store.ts` – `entries`, `month`, `summary`, `trend`, `sections`, `canGoForward`, `goToMonth`, `load`, `add`, `edit`, `remove` |
| UI | `BudgetView.vue`, `EntrySheet.vue`, `ExpenseDonut.vue`, `TrendChart.vue`, `categoryColors.ts` |

## Related

- [budgy](budgy.md) · [entries](budgyEntries.md)
- The same "never stored, always calculated" approach: [weddy / budget](weddyBudget.md)
