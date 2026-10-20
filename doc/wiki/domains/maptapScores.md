---
title: maptap / scores – pasted results and the ranking
type: domain
sources:
  - raw/2026-10-09-maptapLeaderboard.md
  - code: packages/maptap-shared/src, apps/api/src/domain/maptap, apps/portal/src/maptap/scores
updated: 2026-10-20
---

# `maptap / scores` – pasted results and the ranking

> One result is one player's day: the rounds the game gave them and the final
> score. Everything the board shows – the day's ranking and the all-time
> standings – is computed from these; nothing else is stored.

## The pasted text

The game offers a share text in this shape:

```
www.maptap.gg October 9
94:sports_medal: 91:crown: 80:clap: 88:tada: 17:dizzy_face:
Final score: 660
```

`parseScoreText` (`packages/maptap-shared/src/scores.ts`) reads it top-down and
**removes each part it has recognised** before looking for the next, so the
day number and the final score cannot be mistaken for round scores:

| Step | Pattern | Failure |
|---|---|---|
| 1. day | an English month name (full or three letters), a day, optionally a year | `date` |
| 2. final score | `Final score: 660`, the colon optional | `final` |
| 3. rounds | a number **next to a badge** – `94🏅`, `94:crown:`, or `🇺🇸94` | `rounds` |

- **A round must carry a badge.** Without that rule any number left in the text
  would count as a round.
- **The badge can come before the number.** The game has a setting, *Show
  country flags in share* (off by default), that replaces the grade with the
  country's flag and puts it first: `🇺🇸83`. A flag is not a grade, so such a
  round is stored with its points and no badge – but the points have to be
  read, or a player with that setting on could not paste at all.
- `Final score` is **not the sum of the rounds** (660 ≠ 94+91+80+88+17), so it
  is read, never computed.
- Each failure has its own message, all forwarded onto the `text` field – the
  form has one input, so the error has nowhere else to land.
- The share text has **no year**, so the day resolves to the most recent such
  date that is not in the future (`resolvePlayedOn`, four years back, which
  also covers 29 February). A year written in the text wins.
- `Final score: 660 Antipode!` is read as 660 – the game appends that word on
  antipode days.
- Results of a **player map or a Best Of map carry no date** (their first line
  is the map's title), so they are refused. That is right: the board is a
  board of days, and such a result belongs to no day.

### Badges

`BADGE_EMOJI` holds the game's **whole ladder**, worst to best, copied from
`emojiScoring` in `js/jjbasics.js` on maptap.gg:

> 💀 🤮 👽 👻 😭 😱 🤢 😝 😵 🤬 🥺 🧊 😒 ❄ 😥 🙈 😪 😴 🥶 😶 😕 😞 😨 😟 🫣 😔
> 🤫 🤨 😑 😐 🫢 🙃 🙂 😁 😂 🤗 🌞 👏 ✨ 🌟 🎓 🎉 👑 🏆 🏅 🔥 🎯

plus 🤯, which the game gives for a 0 km hit and for rounds whose tier it
cannot compute. The game's own list has 48 slots because 😁 appears twice, so
there are 47 distinct icons; the order is kept because it *is* the grading.

- The emoji is **drawn by us from the badge name**, never echoed from the
  pasted text.
- The game shares **real emoji**; shortcodes (`:crown:`) only appear when the
  text has been through Slack or Discord. Those two name the same icons
  differently, so `BADGE_ALIASES` folds the variants onto one name
  (`medal`, `medal_sports` → `sports_medal`).
- A name we do not know – the game adds a rung, or a country flag arrives from
  the flag mode below – is kept as the sanitised string and shown as the
  number alone. A new icon upstream must not make pasting fail.
- The emoji is **decoration**: it says exactly what the number next to it
  says. It is therefore `aria-hidden` and has no translated label – inventing
  Czech and English names for 48 rungs would be text that tells nobody
  anything. Hovering shows the game's own name for it.

## Fields

| Field | Rule |
|---|---|
| `id`, `userId` | the owner; the board joins the name onto it |
| `playedOn` | `YYYY-MM-DD`, resolved from the text; **one result per player and day** |
| `rounds` | `{ score, badge? }`, 1–20 of them |
| `finalScore` | as written in the text |
| `createdAt` | when it was pasted |

## How a result gets in

The player taps one button and the text is taken **straight from the
clipboard** – they already have it there from the game, so retyping it into a
form and pressing Save were two steps for nothing.

Reading the clipboard is only allowed **after a click and in a secure
context**, never on its own, so the whole thing hangs on a button; no browser
lets a page read the clipboard by itself, and that is a good thing.

When it does not work, `ScoreSheet.vue` opens as a **fallback**:

| Case | What happens |
|---|---|
| the browser refuses the clipboard (permission denied, no API) | the manual form opens with a line saying why – otherwise such a player could never enter a result at all |
| the clipboard holds something unreadable | the manual form opens **with that text in it** and shows the reason right away, without waiting for Save |
| the API refuses the result (a result for that day already exists) | just a message under the button – the text was fine, so a form would not help |

The form validates with `SCORE_PARSE_MESSAGES`, the same map the schema uses,
so the message shown before saving cannot contradict the one the API returns.

## A result is final

There is no update and **no delete**: once a result is on the board, it stays.
A leaderboard is supposed to show what the game produced, and a number the
player can edit or quietly drop is not a result but a claim – with the sum of
the best games it would be enough to delete the weak days.

The consequence is deliberate and worth knowing: **a result pasted by mistake
cannot be taken back** from the app. Only deleting the whole account removes
results (`deleteAllForUser`, used by `UserDataEraser`); anything else is a
manual operation on the database.

## The ranking

Both tables are pure functions over the whole board
(`packages/maptap-shared/src/leaderboard.ts`), computed the same way on the API
and in the browser.

| Function | What it gives |
|---|---|
| `dayBoard(board, day)` | the day's ranking by final score; **equal scores share a rank** (1, 1, 3) – a tie is not worth breaking by who pasted first |
| `standings(board)` | `{ counted, ranked, occasional }` – see below; each row carries games, score, average, best, total and **wins** (days where they had the top score; in a tie everyone wins) |
| `playedDays(board)` | days with at least one result, newest first |

### The ranking: the sum of the best `counted` games

`counted` is the **average number of games per player**, rounded, at least 1.
A player's ranking score is the sum of their `counted` best results.

- **Everybody is measured over the same number of games**, so one lucky day
  cannot carry anyone, and the weakest days drop out instead of dragging a
  regular player down.
- The yardstick is **not an arbitrary constant**: it grows with how much the
  group actually plays.
- It replaced a plain average, which rewarded playing once and well. A total
  of everything was never an option either – that is a ranking of diligence,
  where whoever started first leads and a newcomer can never catch up.
- Equal sums share a rank (1, 1, 3), as in the day board.

### Who is left out

A player with **fewer than `counted` games** is not ranked. Their sum is short
by definition, so among the others it would read as a weak performance even if
they are the best player on the board. `standings` therefore returns them
separately in `occasional`, sorted the same way but **without a `rank`**.

The screen puts them under a 2.5 px orange divider with a line saying why, and
labels their headline number *součet všeho* (all games total) rather than
*součet 3 nejlepších* (top 3 total) – for them the two are the same number and
the second label would claim games they have not played.

A result whose player is unknown (an account deleted between the two queries)
is left out rather than shown as a nameless row.

## The year strip

Every player's card in *Pořadí* (Standings) carries a strip of the **last 365
days** – one square per day, columns are weeks, rows are weekdays starting on
Monday (the site is Czech). It is the GitHub contribution graph with a
different meaning: the colour is **the rank that day**, not a count.

| Square | Meaning |
|---|---|
| full accent | 1st that day |
| 68 % / 42 % / 20 % accent | 2nd / 3rd / 4th and below |
| grey | the player has no result that day |

The steps are spread wide on purpose: with a handful of players almost every
played day is coloured, and neighbouring shades would blur into one surface.

- **Hover or focus shows a tooltip** – the date, the rank *out of how many*
  and the points. The "out of how many" matters: first out of two is not first
  out of five. The tooltip lives outside the scrolling area, so it is not
  clipped, and it is pushed back inside near the edges.
- **Clicking a square opens that day** in the *Den* (Day) tab. Days when
  nobody played are inert – there is nothing to show.
- **The whole strip is one tab stop** and arrows move inside it (left/right by
  a week, up/down by a day). 365 tab stops in a row would be a trap.
- `yearByPlayer` computes **every player at once**, because the screen draws a
  strip per player; asking per player would walk all the results as many times
  as there are players.

Two things are deliberate and worth knowing:

- **The squares are 10 px, far below the 44 px touch target** that
  [frontend.md](../architecture/frontend.md#responsive-layout-and-breakpoints)
  requires. A year of days cannot be drawn at a touch size, and GitHub has the
  same problem. It is acceptable here because the strip is a *shortcut*: the
  same navigation exists on the Day screen as full-size `‹ ›` buttons, and the
  keyboard path above works without a pointer.
- One strip is 365 buttons, so the screen renders **365 × players**. At a
  handful of players that is fine; past roughly twenty it would be worth
  drawing the squares as one SVG instead.

## Endpoints

| Endpoint | Method and path | Request → Response |
|---|---|---|
| `getMapTapBoard` | `GET /api/maptap/board` | → `{ players, scores }` – everything |
| `createMapTapScore` | `POST /api/maptap/scores` | `{ text }` → `201 MapTapScore` |

The board is **one request for everything**: switching the day or the tab then
costs nothing and the two tables cannot disagree. A few people playing once a
day is a few hundred documents a year; if it ever grows, this is where
pagination goes.

**The request body is the text, not the parsed numbers.** `ScoreTextInputSchema`
(what the form and `callEndpoint` validate) stops before the parse;
`ScoreInputSchema` adds the transform and is what the API reads the body with.
Without that split the browser would be the one deciding what 660 means.

## Code

| Layer | File |
|---|---|
| Shared kernel | `packages/maptap-shared/src/scores.ts` (parsing, schemas, badges), `leaderboard.ts` (`dayBoard`, `standings`, `playedDays`, `yearByPlayer`) |
| Domain | `apps/api/src/domain/maptap/score/MapTapScore.ts`, `MapTapScoreRepository.ts`, `PlayerDirectory.ts` |
| Use cases | `apps/api/src/application/maptap/scores.ts` – `getBoard`, `addScore`, `removeScore`, `eraseUserMapTapData` |
| Endpoints | `apps/api/src/endpoints/maptap/scores/`, `apps/portal/src/maptap/scores/endpoints/` |
| UI | `DayView.vue` (the clipboard button), `StandingsView.vue`, `YearGraph.vue` (the year strip), `ScoreSheet.vue` (the manual fallback), `RoundBadges.vue` |
| Storage | container `maptapScores`, PK `/userId` |

The day resolution lives in the **domain**, not the schema: the share text has
no year, so it has to be read against today, and the clock is a dependency of
the domain.

## Related

- [maptap](maptap.md) · [Valibot rules](../architecture/valibot.md) · [personal data](../architecture/personalData.md)
- Source: [raw/2026-10-09-maptapLeaderboard.md](../../raw/2026-10-09-maptapLeaderboard.md)
