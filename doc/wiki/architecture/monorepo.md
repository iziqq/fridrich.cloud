---
title: Monorepo a sdílené balíčky
type: koncept
sources:
  - kód: package.json, packages/*, apps/*
  - historie: doc/architecture.md kap. 1, 2, 6 (commit 8db5e0a)
updated: 2026-09-15
---

# Monorepo a sdílené balíčky

> npm workspaces: dvě aplikace (`apps/portal`, `apps/api`) a sdílené balíčky
> (`packages/*`). Jedna doména, jeden origin, jedna identita, jedno API
> rozdělené na domény.

## Principy

| Princip | Důsledek |
|---|---|
| **Jedna frontendová aplikace** | Portál i produkty jsou jeden Vue projekt, jeden build, jedno nasazení. Produkt je podstrom rout s vlastním vzhledem. Cenou je, že změna v plánovači znamená nasazení celého webu. |
| **Jedna doména, cesty místo subdomén** | `www.fridrich.cloud` – portál `/`, produkty `/izi-weddy`, `/izi-budgy`, API `/api`. Žádné CORS, cookie bez triku se subdoménami. |
| **Jedna identita** | Účet na fridrich.cloud platí ve všech produktech. |
| **Jedno API, více domén** | Jedna Azure Functions aplikace s doménami `identity`, `contact`, `weddy`, `budgy` – ne samostatné Function Apps. |
| **Doména před infrastrukturou** | Viz [domeny.md](domeny.md). |

## Struktura

```
fridrich.cloud/
├── apps/
│   ├── portal/            # celý frontend – viz frontend.md
│   └── api/               # Azure Functions – viz backend.md
├── packages/
│   ├── design/            # CSS: primitives (rozestupy, pohyb, reset) + cyberpunkové téma portálu
│   ├── shared/            # sdílené jádro: Valibot bloky, kontrakt chyb, identita, kontakt
│   └── weddy-shared/      # sdílené jádro IziWeddy: schémata subdomén, výčty, výpočty
├── doc/
│   ├── raw/               # neměnné zdroje (zadání, specifikace)
│   └── wiki/              # znalostní báze pro agenta – začni v wiki/index.md
├── CLAUDE.md              # schéma: pravidla kódu a údržby wiki
└── package.json           # workspaces + skripty
```

## Sdílené balíčky

| Balíček | Obsah | Používá |
|---|---|---|
| `@fridrich/design` | `primitives.css` (struktura), `theme-cyberpunk.css` (portál), fonty, efekty. Produkty berou jen strukturu a dodávají paletu. | portal |
| `@fridrich/shared` | `validation.ts` (Valibot bloky, `issuesToDetails`), `api.ts` (`ApiErrorBodySchema`, `MessageResponseSchema`), `identity.ts` (`UserSchema`, `AccountEmailSchema`, `DisplayNameSchema`, `LOGIN_CODE_LENGTH`), `contact.ts` | portal, api, weddy-shared |
| `@fridrich/weddy-shared` | `wedding.ts`, `guests.ts`, `planning.ts`, `budget.ts` – schéma entit a vstupů, výčty + popisky, `calculateBudget`, `calculateGuestStats`, `groupIntoFamilies`, `daysUntil`, `formatCurrency` | portal, api |
| `@fridrich/budgy-shared` | *(TODO – vznikne s IziBudgy)* | |

**Pravidlo:** sdílený balíček obsahuje jen schémata, výčty a čisté funkce –
žádné volání databáze, HTTP ani komponenty. Doménové objekty s chováním
a stavem žijí v `apps/api/src/domain`.

Balíčky se kompilují do `dist/` (`tsc`); aplikace importují sestavený výstup.
`npm install` spustí `prepare`, který postaví `shared` a `weddy-shared`.
**Po změně ve sdíleném balíčku ho přestav** (`npm run build -w packages/weddy-shared`),
jinak aplikace vidí starý `dist/`.

## Co kam patří

| Kód | Umístění |
|---|---|
| Tvar dat a pravidla polí | `packages/<produkt>-shared` (Valibot) |
| Chování a invarianty domény | `apps/api/src/domain/<doména>/<subdoména>` |
| Orchestrace | `apps/api/src/application/<doména>` |
| HTTP kontrakt | `apps/api/src/endpoints/…` a `apps/portal/src/<doména>/…/endpoints/` |
| Práce s Cosmos DB | `apps/api/src/infrastructure/cosmos` |
| Obrazovky produktu | `apps/portal/src/<produkt>/<subdoména>` |
| Vzhled a texty prezentace | `apps/portal/src/{components,sections,content,views}` |
| Barvy, fonty, mřížka | `packages/design` |
| Komponenta sdílená dvěma aplikacemi | zatím nikde – `packages/ui` vznikne s první skutečně sdílenou |

## Skripty (kořen)

| Skript | Co dělá |
|---|---|
| `npm run dev` / `dev:portal` | Vite dev server portálu (`:5173`) |
| `npm run dev:api` | build + `func start` (`:7071`) |
| `npm run build` | build všech workspaces (balíčky → api → portal) |
| `npm run build:api` | esbuild bundle API do `apps/api/deploy` |
| `npm run typecheck` | `tsc` / `vue-tsc` ve všech workspaces |
| `npm run test` | testy (dnes jen `apps/api`) |
| `npm run lint` | zatím žádný workspace lint nemá (`--if-present`) |

## Související

- [Backend](backend.md) · [Frontend](frontend.md)
- [Lokální vývoj](../provoz/lokalni-vyvoj.md) · [Nasazení](../provoz/nasazeni.md)
