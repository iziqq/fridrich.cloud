---
title: Brief – IziWeddy dashboard and empty state
type: source
date: 2026-09-16
author: Libor Fridrich
language: translated from Czech
---

# Brief – IziWeddy dashboard and empty state

English translation of the project owner's request of 2026-09-16.

---

Let's do the IziWeddy design first. The basics look good, but we should rework the dashboard.

If the user has one wedding plan, we will show a dashboard. If the user has no plan, we should make some nice design saying "you don't have a plan yet". Shall we start?

---

## Answers to follow-up questions (2026-09-16)

**One plan:** a large summary instead of a card – the dashboard stays at
`/izi-weddy`, but with a single plan it renders a large overview of that
wedding: countdown, guests, budget, preparation progress and quick links to the
tabs. With two plans or more the grid of cards comes back.

**Empty state:** a welcome screen with a preview – full-page welcome: heading,
a sentence about what the planner does, a prominent button and four tiles with
the sections (couple, guests, planning, budget), so the user sees what is coming.
