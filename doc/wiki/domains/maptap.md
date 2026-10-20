---
title: maptap domain – MapTap leaderboard
type: domain
sources:
  - raw/2026-10-09-maptapLeaderboard.md
  - code: packages/maptap-shared, apps/api/src/domain/maptap, apps/portal/src/maptap
updated: 2026-10-20
---

# `maptap` domain – the MapTap leaderboard

> An **internal** leaderboard for the daily game at maptap.gg. A player pastes
> the share text the game produces, the app reads the day, the rounds and the
> final score out of it, and shows who did best – today and over all time.

| | |
|---|---|
| **Address** | `www.fridrich.cloud/maptap` |
| **API** | `/api/maptap/*` |
| **Frontend** | `apps/portal/src/maptap/` |
| **Shared kernel** | `packages/maptap-shared` |
| **Identity** | shared account – [identity.md](identity.md) |

## Subdomains

| Subdomain | What it holds | Page |
|---|---|---|
| `scores` | The pasted results and the ranking computed from them | [maptapScores.md](maptapScores.md) |

There is only one, so unlike IziWeddy and IziBudgy the domain does not split
the screens from the data: the leaderboard is a derived view over `scores`,
not an aggregate of its own.

## Decisions of the first version

| Question | Answer | Why |
|---|---|---|
| Who can see it? | **Any signed-in user** | There is no group or membership model on the site, and inventing one for a game between a few people would cost more than it protects. See *Open points* below. |
| Where is it listed? | **Nowhere** | The owner asked for an internal app, so it has no row in `content/apps.ts` and no link anywhere in the portal. |
| Is being unlisted the protection? | **No** | The route carries `requiresAuth` and every endpoint is `access: 'user'`. Not being listed only keeps it out of the way; the API is what refuses. |
| What does the user fill in? | **Nothing** | They paste the text the game offers for sharing. Re-typing five round scores would be slower and would let anyone round the numbers up by accident. |
| Can a result be changed? | **No – it cannot be edited or deleted** | A leaderboard should show what the game produced. A number the player can edit, or quietly drop when the day went badly, is not a result but a claim. |

## Personal data

The board shows **one player's name to another**, which no other product on
the site does – elsewhere the data of an account stays with that account. It
therefore sits inside the `PERSONAL_DATA_COLLECTION_ENABLED` switch on both
sides (endpoints in `personalDataEndpoints`, routes in `personalDataRoutes`),
the privacy policy has its own row, and `eraseUserMapTapData` is registered as
a `UserDataEraser`, so deleting an account takes its results with it.

Only the **display name** reaches the board: the `PlayerDirectory` port returns
nothing else, so an e-mail cannot leak into the response by accident even if
someone later adds a field to the player row. Details:
[personalData.md](../architecture/personalData.md).

## Look

**The portal's own look – the Glass theme**, not a palette of its own: dark
background with orange glows, matte glass surfaces, pill buttons
([portal.md](portal.md#design-glass)). IziWeddy and IziBudgy are products with
their own branding and redefine everything; MapTap is a tool inside the portal,
so making it look like a third product would only add a fourth palette to
maintain.

`maptap/maptap.css` therefore defines no colours of its own. It adds:

| What | Why |
|---|---|
| `--color-surface-alt`, `--color-accent-muted`, `--color-accent-wash`, `--clay-500`, `--shadow-sm/md/lg` | tokens the shared kit expects, invented by the light product themes and never needed by the portal |
| `--color-surface: #16161b` | an **opaque** panel – the portal's translucent surface is right for a card over the glow, but a bottom sheet or an input would let the whole page read through it |
| the glass recipe on `.card` | the translucency and blur that `.glass` gives on the portal; the kit draws cards from tokens, so the effect is repeated here |
| `--radius-pill` on `.btn` | the portal's buttons are pills, the shared kit draws them squarer |
| `--color-backdrop`, `--color-rank-*` | stronger dimming and lighter medal colours, because the page underneath is dark |

The wrapper deliberately has **no background**: the orange glows are on
`body::before`, so an opaque `.maptap` would hide them and the glass cards
would turn into grey rectangles.

## Open points

- **Who is "internal".** Today that means anyone with an account on
  fridrich.cloud who knows the address. If the board should be closed to a
  named group, the smallest step is an allowlist of account ids in the
  application settings, checked in the use cases – no new domain concept
  needed. Not built, because it was not asked for.
- **A result pasted by mistake cannot be taken back.** That is the price of
  results being final; removing one means a manual operation on the database.
  If it turns out to happen, the gentler fix is a short window (say an hour)
  in which the author may delete their own result, not bringing delete back
  for good.

## Related

- [maptap / scores](maptapScores.md)
- [Domain architecture](../architecture/domains.md) · [personal data](../architecture/personalData.md) · [the portal](portal.md)
- Source: [raw/2026-10-09-maptapLeaderboard.md](../../raw/2026-10-09-maptapLeaderboard.md)
