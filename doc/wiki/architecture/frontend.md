---
title: Frontend – apps/portal
type: concept
sources:
  - code: apps/portal
  - history: doc/architecture.md ch. 3 (commit 8db5e0a)
updated: 2026-09-15
---

# Frontend – `apps/portal`

> **One Vue 3 application** (Composition API, `<script setup lang="ts">`, Vite,
> Pinia, Vue Router) on `www.fridrich.cloud`. The portal is at the root,
> products are route subtrees with their own look. Product code is organised by
> domain and subdomain, same as the backend.

## Structure

```
apps/portal/src/
├── api/http.ts                 # callEndpoint + ApiError – the only place with fetch
├── identity/                   # identity domain
│   ├── endpoints/              # register, requestLoginCode, verifyLoginCode, verifyEmail, logout, getCurrentUser
│   ├── auth.store.ts           # signed-in user
│   └── LoginView.vue, RegisterView.vue, VerifyEmailView.vue, AccountView.vue
├── contact/endpoints/          # submitContactMessage
├── weddy/                      # IziWeddy domain
│   ├── wedding/                # endpoints/, wedding.store.ts, DashboardView, WeddingNewView,
│   │                           # CoupleView, WeddingForm, WeddingLayout
│   ├── guests/                 # endpoints/, guests.store.ts, GuestsView
│   ├── planning/               # endpoints/, planning.store.ts, PlanningView, PlanningCategoryView
│   ├── budget/                 # endpoints/, BudgetView
│   ├── components/             # product UI kit (BottomSheet, FormField, StatusBadge, …)
│   ├── routes.ts               # WEDDY_BASE, weddyPath(), routes
│   ├── WeddyShell.vue, NotFoundView.vue, weddy.css
├── components/ sections/ content/ composables/ views/   # presentation portal (not a domain)
├── router/                     # portal routes + embedded product routes, auth guard
├── App.vue, main.ts, style.css
```

## Rules

1. **API calls only through an endpoint file** (`<domain>/endpoints/*.endpoint.ts`),
   which calls `callEndpoint`. No `fetch` in components or stores.
2. **Store** (`<subdomain>.store.ts`, `defineStore`) only for state shared by
   several components or screens (signed-in user, guests, items, current
   wedding). A one-off call without shared state is done by the view itself
   (registration, budget).
3. **Store actions are named after the state change,** not after the endpoint:
   `addFamily` → `createFamily`, `signOut` → `logout`, `activateAccount` → `verifyEmail`.
4. **Data types** come from the shared kernel (`Guest`, `Wedding` from
   `@fridrich/weddy-shared`) or from the endpoint file (`CreateGuestRequest`).
   No hand-written interfaces for API data.
5. **Form errors:** `ApiError.fieldErrors` (key = field path). The same shape
   comes from validation before sending and from a `400` response.
6. **Imports within a domain are relative** (`./wedding.store`), across domains
   via the `@/` alias (`@/identity/auth.store`, `@/weddy/components/FormField.vue`).
7. **Business rules** (calculations, statistics, family grouping) come from the
   shared kernel, they are not rewritten in a component.

## Routing and product look

- A product inserts its routes into the portal router (`weddyRoutes` from
  `weddy/routes.ts`), so moving between portal and planner is a `RouterLink`,
  not a page load.
- The prefix is held by `WEDDY_BASE = '/izi-weddy'`; links are built with `weddyPath('/weddings/…')`.
- `meta: { requiresAuth: true, bare: true }` on the product root: `bare` hides the
  portal header and footer, `requiresAuth` sends an anonymous user to
  `/prihlaseni?redirect=…`. The guard is a convenience, not security – the API guards data.
- `WeddyShell.vue` wraps the product in `<div class="weddy">`, and `weddy.css`
  redefines tokens only under `.weddy`.

> ⚠️ **Every product screen has exactly one `main#obsah`** – either from
> `WeddingLayout` or as the root of its own view. Without `bare` there would be
> two (portal + product) and the skip link would jump to the wrong one.

> ⚠️ **Nothing on `:root` and no bare element selectors in a product theme.**
> Tokens on `:root` would override the portal palette on the whole website.
> Everything goes under `.weddy`.

## Addresses

| Path | Content |
|---|---|
| `/`, `/#o-mne`, `/#sluzby`, `/#vyvoj`, `/#projekty`, `/#kontakt` | Portal – one-page website |
| `/projekty/:id` | Product detail |
| `/prihlaseni`, `/registrace`, `/overeni-emailu`, `/ucet` | Identity (login, registration, e-mail verification, account) |
| `/izi-weddy/*` | IziWeddy – routes in [weddy.md](../domains/weddy.md#routes) |
| `/izi-budgy/*` | IziBudgy *(TODO)* |
| `/api/*` | API (the Vite dev server proxies it to `:7071`) |

Routes and anchors are Czech because they are part of the public website.

## Related

- [Domain architecture](domains.md) · [Endpoints](endpoints.md) · [Valibot](valibot.md)
- [Portal and design system](../domains/portal.md)
