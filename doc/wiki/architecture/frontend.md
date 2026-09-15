---
title: Frontend – apps/portal
type: koncept
sources:
  - kód: apps/portal
  - historie: doc/architecture.md kap. 3 (commit 8db5e0a)
updated: 2026-09-15
---

# Frontend – `apps/portal`

> **Jedna Vue 3 aplikace** (Composition API, `<script setup lang="ts">`,
> Vite, Pinia, Vue Router) na doméně `www.fridrich.cloud`. Portál je v kořeni,
> produkty jsou podstromy rout s vlastním vzhledem. Kód produktů je členěný
> podle domén a subdomén, stejně jako backend.

## Struktura

```
apps/portal/src/
├── api/http.ts                 # callEndpoint + ApiError – jediné místo s fetch
├── identity/                   # doména identity
│   ├── endpoints/              # register, requestLoginCode, verifyLoginCode, verifyEmail, logout, getCurrentUser
│   ├── auth.store.ts           # přihlášený uživatel
│   └── LoginView.vue, RegisterView.vue, VerifyEmailView.vue, AccountView.vue
├── contact/endpoints/          # submitContactMessage
├── weddy/                      # doména IziWeddy
│   ├── wedding/                # endpoints/, wedding.store.ts, DashboardView, WeddingNewView,
│   │                           # CoupleView, WeddingForm, WeddingLayout
│   ├── guests/                 # endpoints/, guests.store.ts, GuestsView
│   ├── planning/               # endpoints/, planning.store.ts, PlanningView, PlanningCategoryView
│   ├── budget/                 # endpoints/, BudgetView
│   ├── components/             # UI stavebnice produktu (BottomSheet, FormField, StatusBadge, …)
│   ├── routes.ts               # WEDDY_BASE, weddyPath(), routy
│   ├── WeddyShell.vue, NotFoundView.vue, weddy.css
├── components/ sections/ content/ composables/ views/   # prezentační portál (není doména)
├── router/                     # routy portálu + vložené routy produktů, auth guard
├── App.vue, main.ts, style.css
```

## Pravidla

1. **Volání API jen přes endpoint soubor** (`<doména>/endpoints/*.endpoint.ts`),
   ten volá `callEndpoint`. Žádný `fetch` v komponentách ani ve store.
2. **Store** (`<subdoména>.store.ts`, `defineStore`) jen pro stav sdílený více
   komponentami nebo obrazovkami (přihlášený uživatel, hosté, položky, aktuální
   svatba). Jednorázové volání bez sdíleného stavu udělá view samo
   (registrace, rozpočet).
3. **Akce store se jmenují podle změny stavu,** ne podle endpointu:
   `addFamily` → `createFamily`, `signOut` → `logout`, `activateAccount` → `verifyEmail`.
4. **Typy dat** se berou ze sdíleného jádra (`Guest`, `Wedding` z
   `@fridrich/weddy-shared`) nebo z endpoint souboru (`CreateGuestRequest`).
   Ruční interface pro data API se nepíše.
5. **Chyby formulářů:** `ApiError.fieldErrors` (klíč = cesta pole). Stejný tvar
   přichází z validace před odesláním i z odpovědi `400`.
6. **Import v rámci domény relativně** (`./wedding.store`), mezi doménami přes
   alias `@/` (`@/identity/auth.store`, `@/weddy/components/FormField.vue`).
7. **Business pravidla** (výpočty, statistiky, seskupení rodin) se berou ze
   sdíleného jádra, nepíšou se znovu v komponentě.

## Routing a vzhled produktu

- Produkt vkládá své routy do routeru portálu (`weddyRoutes` z `weddy/routes.ts`),
  takže přechod portál ↔ plánovač je `RouterLink`, ne načtení stránky.
- Prefix drží `WEDDY_BASE = '/izi-weddy'`; odkazy skládá `weddyPath('/weddings/…')`.
- `meta: { requiresAuth: true, bare: true }` na kořeni produktu: `bare`
  schová hlavičku a patičku portálu, `requiresAuth` pošle nepřihlášeného na
  `/prihlaseni?redirect=…`. Guard je pohodlí, ne bezpečnost – data hlídá API.
- `WeddyShell.vue` obalí produkt `<div class="weddy">`, `weddy.css`
  předefinuje tokeny jen pod `.weddy`.

> ⚠️ **Každá obrazovka produktu má právě jeden `main#obsah`** – buď z
> `WeddingLayout`, nebo jako kořen vlastního pohledu. Bez `bare` by vedle
> sebe byly dva (portál + produkt) a skip link by skočil špatně.

> ⚠️ **V tématu produktu nic na `:root` ani holý selektor prvku.** Tokeny
> na `:root` by přebily paletu portálu na celém webu. Všechno pod `.weddy`.

## Adresy

| Cesta | Obsah |
|---|---|
| `/`, `/#o-mne`, `/#sluzby`, `/#vyvoj`, `/#projekty`, `/#kontakt` | Portál – jednostránkový web |
| `/projekty/:id` | Detail produktu |
| `/prihlaseni`, `/registrace`, `/overeni-emailu`, `/ucet` | Identita |
| `/izi-weddy/*` | IziWeddy – routy v [weddy.md](../domeny/weddy.md#routy) |
| `/izi-budgy/*` | IziBudgy *(TODO)* |
| `/api/*` | API (Vite dev server ho proxuje na `:7071`) |

## Související

- [Doménová architektura](domeny.md) · [Endpointy](endpointy.md) · [Valibot](valibot.md)
- [Portál a design systém](../domeny/portal.md)
