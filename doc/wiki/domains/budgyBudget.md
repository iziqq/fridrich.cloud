---
title: budgy / budget – the month on screen
type: domain
sources:
  - raw/2026-09-17-budgyStart.md
  - raw/2026-09-17-budgyDashboard.md
  - code: packages/budgy-shared/src/summary.ts, apps/portal/src/budgy/budget
updated: 2026-09-17
---

# `budgy / budget` – the overview and the month

> Two screens: the **overview** (`/izi-budgy`) with the totals of the whole
> history and a *Tento měsíc* (This month) widget, and the **month**
> (`/izi-budgy/mesic`) with its numbers, charts and entries. Nothing is stored:
> everything is computed from the entries ([entries](budgyEntries.md)), so no
> figure can drift from the data.

## Values (`summarizeMonth`)

| Value | Calculation |
|---|---|
| `income`, `expenses`, `investments` | sums of the entries that apply in the month, by kind |
| `remaining` | `income − expenses − investments`; a negative number means the month did not work out |
| `savedShare` | how much of the income is left, 0–1; zero without income (nothing is divided by zero) |
| `recurringIncome`, `oneOffIncome` | income split by recurrence |
| `recurringExpenses`, `oneOffExpenses` | the same for expenses – the two expense sections on screen |
| `recurringInvestments`, `oneOffInvestments` | the same for investments |
| `byCategory[]` | only the categories something was spent on, sorted from the most expensive, each with its `share` of the month's expenses |

`monthlyTrend(entries, month, 6)` returns the last six months **including empty
ones** – closing a gap in the row would make the bars lie about what follows
what.

`overallSummary(entries, untilMonth)` adds the months up **one by one, not
entry by entry**: a recurring salary applies in every month of its range, so
five months of 50,000 is 250,000. Summing entries would give 50,000 and the
number would lie. It looks at most ten years back, so a typo in the year of a
one-off entry cannot stretch the loop over centuries.

## Overview (`DashboardView.vue`)

| Block | What it does |
|---|---|
| Totals | Income, expenses, investments and what is left **over the whole history**, each with a monthly average – the only figure comparable between households. "Total" is the history on purpose: the same numbers for the current month sit right below in the widget. |
| *Tento měsíc* (This month) | A clickable widget with the month's four figures and a bar; it leads to the month screen. |
| *Posledních šest měsíců* | The trend chart; clicking a month opens it. |

With no entries at all the screen is a single empty state, and the **main action
sits inside that card** – a floating button in the corner is for a screen that
already has content.

## Month (`BudgetView.vue`)

| Block | What it does |
|---|---|
| Header | The month with `‹ ›` arrows; forward only up to the current month, plus a *Zpět na tento měsíc* (Back to this month) button. Nobody budgets next year. |
| Summary | Income, expenses and what is left, and two bars scaled to the larger of the two – when expenses outgrow income, it is visible by how much. |
| *Kam peníze jdou* (Where the money goes) | Expenses of the month as a **donut with a legend** – `ExpenseDonut.vue`. |
| *Posledních šest měsíců* (The last six months) | Pairs of bars, income against expenses – `TrendChart.vue`. Clicking a month switches the screen to it, so the chart is also navigation. |
| Entries | Four sections in the order a budget is read: *Příjmy* (Income), *Pravidelné výdaje* (Recurring expenses), *Jednorázové výdaje* (One-off expenses), *Investice* (Investments), each with its total and an add button. |

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
| Shared kernel | `packages/budgy-shared/src/summary.ts` – `MonthSummarySchema`, `CategoryShareSchema`, `OverallSummarySchema`, `summarizeMonth`, `overallSummary`, `monthlyTrend` |
| Store | `budget.store.ts` – `entries`, `month`, `summary`, `overall`, `trend`, `sections`, `canGoForward`, `goToMonth`, `load`, `add`, `edit`, `remove` |
| UI | `BudgyLayout.vue`, `DashboardView.vue`, `BudgetView.vue`, `EntrySheet.vue`, `ExpenseDonut.vue`, `TrendChart.vue`, `categoryColors.ts` |

## The product frame (`BudgyLayout.vue`)

Both screens share a top bar: back to the portal hub, the product name, the
**language switch** (the product hides the portal navigation, so it has to be
here) and tabs *Přehled* (Overview) and the name of the month being viewed. Two
rows on purpose – at 360 px the three parts do not fit next to each other
without truncating the labels.

## Related

- [budgy](budgy.md) · [entries](budgyEntries.md)
- The same "never stored, always calculated" approach: [weddy / budget](weddyBudget.md)
