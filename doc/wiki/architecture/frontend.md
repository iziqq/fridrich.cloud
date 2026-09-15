---
title: Frontend – apps/portal
type: concept
sources:
  - code: apps/portal
  - history: doc/architecture.md ch. 3 (commit 8db5e0a)
  - raw/2026-09-15-responsiveFrontend.md
  - raw/portalSpec.md (navigation, services grid), raw/iziweddySpec.md (ch. 6.3)
  - code: packages/design/src/breakpoints.css, apps/portal/postcss.config.js
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
├── api/http.ts                 # callEndpoint + ApiError – the only place with fetch; sends Accept-Language
├── i18n/                       # vue-i18n: index.ts (setup, setLocale, translateMessage), locales/<area>.ts (cs + en)
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
8. **Everything is responsive** – mobile, tablet and notebook, with the named
   breakpoints below. A screen that works only on one width is not finished.
9. **No hard-coded texts** – `t('area.key')` from the area catalog, API/validation keys via
   `translateMessage`; the language switcher (`LocaleSwitcher.vue`) is in the portal navigation and
   the IziWeddy headers ([i18n.md](i18n.md)).

## Responsive layout and breakpoints

Every view and component – the portal and all products – must work from a
**360 px** phone up to a notebook. Styles are written **mobile-first**: the base
CSS is the mobile layout and wider layouts are added with named breakpoints.

| Device | Width | Media query | Typical layout |
|---|---|---|---|
| Mobile | 360–767 px | base styles, no query | one column, menu icon with a fullscreen overlay, bottom navigation and FAB in products, forms as a bottom sheet, tables as card lists |
| Tablet | 768–1023 px | `@media (--tablet)` | two columns, full top navigation, bottom sheet as a centred dialog, tables allowed |
| Notebook | ≥ 1024 px | `@media (--notebook)` | three columns / side-by-side panels, content capped at `--content-max` (`1200px`) |

**Why these values:** the portal specification already switches the menu at
`768px` and describes a 1 / 2 / 3 column grid for mobile / tablet / desktop;
`1024px` is the common notebook and landscape-tablet threshold. Mobile-first
matches both specifications (IziWeddy is primarily a phone app) and keeps the
base CSS the simplest one. Nothing larger than notebook gets its own breakpoint –
wider screens only centre the capped content.

### Where breakpoints are defined

```css
/* packages/design/src/breakpoints.css – the only place with the widths */
@custom-media --tablet (min-width: 768px);
@custom-media --notebook (min-width: 1024px);

/* any component */
@media (--tablet) { .grid { grid-template-columns: repeat(2, 1fr); } }
```

| Piece | Role |
|---|---|
| `packages/design/src/breakpoints.css` | `@custom-media` definitions; not imported into CSS |
| `apps/portal/postcss.config.js` | `@csstools/postcss-global-data` injects the definitions into every stylesheet and `<style>` block, `postcss-custom-media` compiles `(--tablet)` to `(min-width: 768px)` and removes the definitions |

**Why `@custom-media` and not literal px or a JS constant:** CSS custom
properties do not work inside `@media`, so without it every component repeats
the numbers – which is exactly how the code drifted to six different widths.
`@custom-media` is standard syntax (Media Queries Level 5), so the source stays
plain CSS and the PostCSS step can be dropped once browsers support it; a
Sass/Less preprocessor was rejected because the project has none and it would
be added only for this. Trade-off: two dev dependencies, and editors may flag
`@custom-media` as an unknown at-rule.

Rules:

- **Only `--tablet` and `--notebook`** – never a px width in `@media`. Do not
  invent in-between breakpoints for one component; fix the component with
  `minmax(0, 1fr)`, `flex-wrap`, `auto-fit` or `clamp()` instead.
- **No horizontal page scroll** at any width. Wide content (tables) becomes a
  card list on mobile, or scrolls inside its own container. Grid columns that
  hold long words use `minmax(0, 1fr)` – plain `1fr` cannot shrink below the
  longest word and pushes the page wider.
- **Touch targets at least 44 × 44 px** on every width; nothing depends on hover.
- Fluid typography and spacing with `clamp()` where the specification defines a
  mobile → desktop scale ([portal.md](../domains/portal.md)).
- Images and media `max-width: 100%`; no fixed widths in px on layout containers.
- **Check before finishing:** every changed screen at 360, 768 and 1024 px
  (browser device toolbar) – page width must equal the viewport width.

Current use:

| Breakpoint | Components |
|---|---|
| `--tablet` | `SiteNav` (full menu), `SiteFooter`, `ServicesSection` (2 columns), `ProjectsSection`, `AccountView`, `BottomSheet` (centred dialog), `WeddingForm`, `GuestsView` (form rows), `DashboardView`, `PlanningView` |
| `--notebook` | `ServicesSection` (4 columns), `AboutSection` and `ContactSection` (side-by-side), `ProcessSection` (horizontal stepper, 3 × 2) |

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
| `/prihlaseni`, `/registrace`, `/overeni-emailu`, `/ucet` | Identity (login, registration, e-mail verification, account incl. deletion) |
| `/ochrana-osobnich-udaju`, `/obchodni-podminky` | Privacy policy and terms (`LegalView`, always registered) |
| `/izi-weddy/*` | IziWeddy – routes in [weddy.md](../domains/weddy.md#routes) |
| `/izi-budgy/*` | IziBudgy *(TODO)* |
| `/api/*` | API (the Vite dev server proxies it to `:7071`) |

Routes and anchors are Czech because they are part of the public website.

> ℹ️ Identity routes and `/izi-weddy/*` are in `personalDataRoutes` and are
> registered only when `PERSONAL_DATA_COLLECTION_ENABLED` is on (currently on);
> with the switch off they return the 404 page ([personalData.md](personalData.md)).

## Related

- [Domain architecture](domains.md) · [Endpoints](endpoints.md) · [Valibot](valibot.md)
- [Portal and design system](../domains/portal.md)
