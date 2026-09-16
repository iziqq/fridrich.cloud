---
title: Brief – IziBudgy dashboard, investments, top bar
type: source
date: 2026-09-17
author: Libor Fridrich
language: translated from Czech
---

# Brief – IziBudgy dashboard, investments, top bar

English translation of the project owner's requests of 2026-09-17.

---

Now let's change the Budgy dashboard.

Right now it is rather bare. There should be an overview of total income, total
expenses and so on.

Then there will be a widget – This month – which can be clicked and shows the
page that is now at `/izi-budgy`.

I would also add Investments, next to income and expenses.

*(Follow-ups in the same conversation: "then add the option to switch between CZ
and EN", "the + Položka (Add entry) button is all the way to the right, it should
be in the placeholder card Začněme příjmem (Let us start with the income)",
"make a top bar for Budgy – Overview, current month and so on".)*

---

## Decisions taken while implementing

1. **"Total" means the whole history**, not the current month – otherwise the
   *This month* widget next to it would say the same thing twice. Totals are
   summed month by month, so a recurring salary counts once per month it applies
   to.
2. **An investment is a third kind of entry**, not an expense category. The
   money leaves the account, so it lowers what is left, but it is not spent –
   it would distort both the category breakdown and the answer to "how much
   does this month cost".
