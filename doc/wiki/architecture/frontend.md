---
title: Frontend – apps/portal
type: concept
sources:
  - code: apps/portal
  - history: doc/architecture.md ch. 3 (commit 8db5e0a)
  - raw/2026-09-15-responsiveFrontend.md
  - raw/portalSpec.md (navigation, services grid), raw/iziweddySpec.md (ch. 6.3)
  - code: packages/design/src/breakpoints.css, apps/portal/postcss.config.js
updated: 2026-09-17
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

## Page shell and short pages

`#app` is a **flex column with `min-height: 100dvh`** and `main` grows inside it
(`apps/portal/src/style.css`), so the footer always ends up at the bottom of the
window, never in the middle of a half-empty screen.

| Rule | Why |
|---|---|
| `#app { display: flex; flex-direction: column; min-height: 100dvh }` | A fixed `height: 100dvh` made the content area exactly one window tall, so on a short page the footer was pushed below the fold and the page scrolled for no reason. |
| `#app > main { display: flex; flex: 1; flex-direction: column }` | `main` takes the leftover height; the column lets the page inside it grow (a percentage height on a child of a flex item does not resolve). |
| `#app > main > .page { flex: 1; justify-content: center; padding-block: 6rem var(--space-8) }` | `.page` is the root of every short portal screen (project detail, sign-in, account, 404). It fills the leftover space and centres its content, so the empty space is split around it instead of piling up above the footer. `6rem` is enough to clear the floating navigation pill. |
| `SiteFooter` has **no fixed top margin** | The separation from a long page comes from the last section's own `padding-block: var(--section-gap)`; an extra gap only made short pages overflow the window. |

A product (`meta.bare`) renders its own shell (`.weddy` with `min-height: 100dvh`),
so none of this applies to it.

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

### Product UI kit

Both products (IziWeddy, IziBudgy) share one set of components in
`components/product/` – `BottomSheet`, `ConfirmDialog` (+ `confirm.ts`),
`FormField`, `SelectField`, `ChoiceField`, `EmptyState`, `ErrorBlock`,
`LoadingBlock`, `FabButton` – and one stylesheet, `styles/product.css`, with
the elements used by class (`.btn`, `.btn-primary`, `.card`). They hang on the
class `.product`, which every product wrapper carries next to its own
(`<div class="weddy product">`).

**A shared component may only reach for semantic tokens** (`--color-accent`,
`--color-accent-strong`, `--color-accent-wash`, `--color-surface-alt`…), never
for a palette shade such as `--rose-400`. A product theme defines the tokens;
that is the whole difference between them. The kit used to live under `weddy/`
and reached straight into the rose palette, so the first budgy screens came out
pink.

`StatusBadge` stayed in `weddy/components/` – its statuses (`guest`,
`planning`) belong to that product.

> ⚠️ **Anything teleported to `body` carries the product class itself.**
> `BottomSheet.vue` renders through `<Teleport to="body">`, which puts the
> overlay outside the `.weddy` subtree – neither the tokens nor `.weddy .btn`
> would reach it, and the buttons inside sheets fell back to the browser's grey
> default. The teleported root is therefore `<div class="weddy overlay">` – and
> because the class also carries the theme's own **background**, the overlay has
> to set `background: transparent`, otherwise it covers the page instead of
> dimming it. Which product is on screen is held by `components/product/theme.ts`
> (`useProductTheme('budgy')` in the shell), so the overlays do not have to
> guess the class.

Form controls that the operating system would draw are replaced by our own
components – `SelectField.vue` instead of `<select>`, `ConfirmDialog.vue`
instead of `window.confirm` (see [weddy.md](../domains/weddy.md#shared-components)).
The theme therefore styles only what the browser renders acceptably: text
inputs, textareas and buttons.

## Addresses

| Path | Content |
|---|---|
| `/` | Portal – the hub of applications and sign-in ([portal.md](../domains/portal.md)) |
| `/o-mne`, `/o-mne#sluzby`, `/o-mne#vyvoj`, `/o-mne#projekty`, `/o-mne#kontakt` | Presentation on one page (old `/#…` links are redirected) |
| `/projekty/:id` | Product detail |
| `/prihlaseni`, `/registrace`, `/overeni-emailu`, `/ucet` | Identity (login, registration, e-mail verification, account incl. deletion) |
| `/ochrana-osobnich-udaju`, `/obchodni-podminky` | Privacy policy and terms (`LegalView`, always registered) |
| `/izi-weddy/*` | IziWeddy – routes in [weddy.md](../domains/weddy.md#routes) |
| `/izi-budgy`, `/izi-budgy/mesic` | IziBudgy – the overview and one month ([budgyBudget.md](../domains/budgyBudget.md)) |
| `/api/*` | API (the Vite dev server proxies it to `:7071`) |

Routes and anchors are Czech because they are part of the public website.

> ℹ️ Identity routes, `/izi-weddy/*` and `/izi-budgy/*` are in `personalDataRoutes` and are
> registered only when `PERSONAL_DATA_COLLECTION_ENABLED` is on (currently on);
> with the switch off they return the 404 page ([personalData.md](personalData.md)).

## Related

- [Domain architecture](domains.md) · [Endpoints](endpoints.md) · [Valibot](valibot.md)
- [Portal and design system](../domains/portal.md)
