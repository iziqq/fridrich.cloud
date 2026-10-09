---
title: maptap / scores – pasted results and the ranking
type: domain
sources:
  - raw/2026-10-09-maptapLeaderboard.md
  - code: packages/maptap-shared/src, apps/api/src/domain/maptap, apps/portal/src/maptap/scores
updated: 2026-10-09
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
| 3. rounds | a number **immediately followed by a badge** – `:crown:` or the emoji itself | `rounds` |

- **A round must carry a badge.** Without that rule any number left in the text
  would count as a round.
- `Final score` is **not the sum of the rounds** (660 ≠ 94+91+80+88+17), so it
  is read, never computed.
- Each failure has its own message, all forwarded onto the `text` field – the
  form has one input, so the error has nowhere else to land.
- The share text has **no year**, so the day resolves to the most recent such
  date that is not in the future (`resolvePlayedOn`, four years back, which
  also covers 29 February). A year written in the text wins.

### Badges

| Shortcode | Shown as |
|---|---|
| `sports_medal` | 🏅 |
| `crown` | 👑 |
| `clap` | 👏 |
| `tada` | 🎉 |
| `dizzy_face` | 😵 |

The emoji is **drawn by us from the badge name**, never echoed from the pasted
text. A shortcode we do not know (the game adds one) is stored as the
sanitised name and shown as the number alone – a new emoji upstream must not
make pasting fail. Pasting from a client that renders emoji works too: the
known emoji map back to their names.

## Fields

| Field | Rule |
|---|---|
| `id`, `userId` | the owner; the board joins the name onto it |
| `playedOn` | `YYYY-MM-DD`, resolved from the text; **one result per player and day** |
| `rounds` | `{ score, badge? }`, 1–20 of them |
| `finalScore` | as written in the text |
| `createdAt` | when it was pasted |

A result is **immutable**: there is no update use case. Correcting it means
deleting it and pasting again, and a player can only delete their own – a
stranger's result answers `notFound`, not `forbidden`, so trying ids tells
nobody what exists.

## The ranking

Both tables are pure functions over the whole board
(`packages/maptap-shared/src/leaderboard.ts`), computed the same way on the API
and in the browser.

| Function | What it gives |
|---|---|
| `dayBoard(board, day)` | the day's ranking by final score; **equal scores share a rank** (1, 1, 3) – a tie is not worth breaking by who pasted first |
| `standings(board)` | per player: games, average, best, total and **wins** (days where they had the top score; in a tie everyone wins) |
| `playedDays(board)` | days with at least one result, newest first |

**The standings rank by average, not by total.** A total is a ranking of
diligence – whoever has played longest leads and a newcomer can never catch
up. The games column sits next to it, so a high average from one game is
visible for what it is.

A result whose player is unknown (an account deleted between the two queries)
is left out rather than shown as a nameless row.

## Endpoints

| Endpoint | Method and path | Request → Response |
|---|---|---|
| `getMapTapBoard` | `GET /api/maptap/board` | → `{ players, scores }` – everything |
| `createMapTapScore` | `POST /api/maptap/scores` | `{ text }` → `201 MapTapScore` |
| `deleteMapTapScore` | `DELETE /api/maptap/scores/{scoreId}` | → `204` |

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
| Shared kernel | `packages/maptap-shared/src/scores.ts` (parsing, schemas, badges), `leaderboard.ts` (`dayBoard`, `standings`, `playedDays`) |
| Domain | `apps/api/src/domain/maptap/score/MapTapScore.ts`, `MapTapScoreRepository.ts`, `PlayerDirectory.ts` |
| Use cases | `apps/api/src/application/maptap/scores.ts` – `getBoard`, `addScore`, `removeScore`, `eraseUserMapTapData` |
| Endpoints | `apps/api/src/endpoints/maptap/scores/`, `apps/portal/src/maptap/scores/endpoints/` |
| UI | `DayView.vue`, `StandingsView.vue`, `ScoreSheet.vue` (paste + preview), `RoundBadges.vue` |
| Storage | container `maptapScores`, PK `/userId` |

The day resolution lives in the **domain**, not the schema: the share text has
no year, so it has to be read against today, and the clock is a dependency of
the domain.

## Related

- [maptap](maptap.md) · [Valibot rules](../architecture/valibot.md) · [personal data](../architecture/personalData.md)
- Source: [raw/2026-10-09-maptapLeaderboard.md](../../raw/2026-10-09-maptapLeaderboard.md)
