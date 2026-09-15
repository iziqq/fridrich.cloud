---
title: Monorepo and shared packages
type: concept
sources:
  - code: package.json, packages/*, apps/*
  - history: doc/architecture.md ch. 1, 2, 6 (commit 8db5e0a)
updated: 2026-09-15
---

# Monorepo and shared packages

> npm workspaces: two applications (`apps/portal`, `apps/api`) and shared
> packages (`packages/*`). One domain name, one origin, one identity, one API
> split into domains.

## Principles

| Principle | Consequence |
|---|---|
| **One frontend application** | Portal and products are one Vue project, one build, one deployment. A product is a route subtree with its own look. The price: a change in the planner means deploying the whole website. |
| **One domain name, paths instead of subdomains** | `www.fridrich.cloud` – portal `/`, products `/izi-weddy`, `/izi-budgy`, API `/api`. No CORS, cookies without subdomain tricks. |
| **One identity** | An account on fridrich.cloud works in every product. |
| **One API, several domains** | One Azure Functions app with domains `identity`, `contact`, `weddy`, `budgy` – not separate Function Apps. |
| **Domain before infrastructure** | See [domains.md](domains.md). |

## Structure

```
fridrich.cloud/
├── apps/
│   ├── portal/            # the whole frontend – see frontend.md
│   └── api/               # Azure Functions – see backend.md
├── packages/
│   ├── design/            # CSS: primitives (spacing, motion, reset) + cyberpunk portal theme
│   ├── shared/            # shared kernel: Valibot building blocks, error contract, identity, contact
│   └── weddy-shared/      # IziWeddy shared kernel: subdomain schemas, enums, calculations
├── doc/
│   ├── raw/               # immutable sources (briefs, specifications)
│   └── wiki/              # agent knowledge base – start at wiki/index.md
├── CLAUDE.md              # schema: code rules and wiki maintenance
└── package.json           # workspaces + scripts
```

## Shared packages

| Package | Content | Used by |
|---|---|---|
| `@fridrich/design` | `primitives.css` (structure), `breakpoints.css` (`@custom-media --tablet`, `--notebook`), `theme-cyberpunk.css` (portal), fonts, effects. Products take only the structure and supply their own palette. | portal |
| `@fridrich/shared` | `validation.ts` (Valibot building blocks, `issuesToDetails`), `api.ts` (`ApiErrorBodySchema`, `MessageResponseSchema`), `identity.ts` (`UserSchema`, `AccountEmailSchema`, `DisplayNameSchema`, `LOGIN_CODE_LENGTH`), `contact.ts` | portal, api, weddy-shared |
| `@fridrich/weddy-shared` | `wedding.ts`, `guests.ts`, `planning.ts`, `budget.ts` – entity and input schemas, enums + labels, `calculateBudget`, `calculateGuestStats`, `groupIntoFamilies`, `daysUntil`, `formatCurrency` | portal, api |
| `@fridrich/budgy-shared` | *(TODO – created together with IziBudgy)* | |

**Rule:** a shared package contains only schemas, enums and pure functions – no
database calls, HTTP or components. Domain objects with behaviour and state
live in `apps/api/src/domain`.

Packages compile to `dist/` (`tsc`); applications import the built output.
`npm install` runs `prepare`, which builds `shared` and `weddy-shared`.
**After changing a shared package, rebuild it** (`npm run build -w packages/weddy-shared`),
otherwise applications see the old `dist/`.

## What goes where

| Code | Location |
|---|---|
| Data shape and field rules | `packages/<product>-shared` (Valibot) |
| Domain behaviour and invariants | `apps/api/src/domain/<domain>/<subdomain>` |
| Orchestration | `apps/api/src/application/<domain>` |
| HTTP contract | `apps/api/src/endpoints/…` and `apps/portal/src/<domain>/…/endpoints/` |
| Cosmos DB access | `apps/api/src/infrastructure/cosmos` |
| Product screens | `apps/portal/src/<product>/<subdomain>` |
| Presentation look and copy | `apps/portal/src/{components,sections,content,views}` |
| Colours, fonts, grid | `packages/design` |
| A component shared by two apps | nowhere yet – `packages/ui` will be created with the first truly shared one |

## Scripts (root)

| Script | What it does |
|---|---|
| `npm run dev` / `dev:portal` | portal Vite dev server (`:5173`) |
| `npm run dev:api` | build + `func start` (`:7071`) |
| `npm run build` | build all workspaces (packages → api → portal) |
| `npm run build:api` | esbuild bundle of the API into `apps/api/deploy` |
| `npm run typecheck` | `tsc` / `vue-tsc` in all workspaces |
| `npm run test` | tests (only `apps/api` today) |
| `npm run lint` | no workspace has a lint script yet (`--if-present`) |

## Related

- [Backend](backend.md) · [Frontend](frontend.md)
- [Local development](../operations/localDevelopment.md) · [Deployment](../operations/deployment.md)
