---
title: Brief – the portal as an app hub
type: source
date: 2026-09-17
author: Libor Fridrich
language: translated from Czech
---

# Brief – the portal as an app hub

English translation of the project owner's request of 2026-09-17.

---

We should change the portal. The portal should be mainly about showing the
applications, signing in and so on.

I would also like to add mini applications to the portal.

"O mně" (About me) should be a page, the same way IziWeddy and the rest are.

---

## Decisions taken with the owner on the same day

1. **The home page `/` shows the applications and signing in only** – a set of
   tiles and nothing else. It is a signpost, not a business card.
2. **The whole of today's one-pager moves to `/o-mne`**, anchors included
   (`#sluzby`, `#vyvoj`, `#projekty`, `#kontakt`). Keeping it together is less
   work than splitting it, and old links can be redirected.
3. **"Mini applications" will be apps like IziWeddy and IziBudgy**, possibly
   bigger – not small browser-only tools. So each one gets its own route
   subtree, theme and account, and the hub only needs a registry of them.
