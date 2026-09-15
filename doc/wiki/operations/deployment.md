---
title: Nasazení
type: provoz
sources:
  - kód: .github/workflows/azure-static-web-apps.yml, apps/api/scripts/build-deploy.mjs, apps/portal/public/staticwebapp.config.json
  - historie: doc/architecture.md kap. 9 (commit 8db5e0a)
updated: 2026-09-15
---

# Nasazení

> Jedna **Azure Static Web App (Free)** na `www.fridrich.cloud`: web z
> `apps/portal/dist` a API jako **spravované funkce** z `apps/api/deploy`.
> Nasazuje GitHub Actions přes SWA CLI. Cíl: vejít se do bezplatných tierů.

## Služby

| Část | Služba | Tier |
|---|---|---|
| Frontend | Azure Static Web App `LiborFridrich` (resource group `lf-page`) | Free |
| API | spravované funkce téže SWA na `/api` | součást Free |
| Databáze | Cosmos DB `lf-page-db`, sdílená kapacita databáze | Free tier (1000 RU/s, 25 GB) |
| E-maily | SMTP | vlastní schránka |

> ⚠️ **API nesmí být samostatný Function App** – připojení vlastní Functions
> aplikace je funkce Standard plánu (~9 $/měsíc). Důsledky: žádná managed
> identity (Cosmos přes `COSMOS_KEY`), žádné Key Vault reference, jen HTTP
> triggery, runtime `node:20` z `staticwebapp.config.json`.

## Pipeline (`.github/workflows/azure-static-web-apps.yml`)

1. `npm ci` (postaví sdílené balíčky)
2. `npm run typecheck`, `npm run lint`, `npm run test`
3. **Pojistka: aspoň 60 testů API** – `node --test` bez nalezených souborů
   skončí nulou testů s kódem 0. Dnes 97 testů.
4. `npm run build` → `apps/portal/dist` (včetně `staticwebapp.config.json` z `public/`)
5. `npm run build:api` → `apps/api/deploy`
6. `npx @azure/static-web-apps-cli@2 deploy` – PR do prostředí `pr-<číslo>`
   (Azure z něj udělá `pr123`, Free zvládne 3), `main` do `production`.
   Spustit jde i ručně (`workflow_dispatch`).

Jediné tajemství: `AZURE_STATIC_WEB_APPS_API_TOKEN` (Manage deployment token).

> ⚠️ **Nasazuje SWA CLI, ne akce `Azure/static-web-apps-deploy@v1`** – ta
> neumí přeskočit build API a padala na `An unknown exception has occurred`.

## API jako soběstačný balíček

Spravované funkce závislosti nedoinstalují a workspace balíčky nejsou na npm.
`scripts/build-deploy.mjs` proto esbuildem spojí **všechno** (kód, `@fridrich/*`,
`valibot`, Azure SDK) do jednoho `index.js`; venku zůstává jen `@azure/functions`.

- Posílat `node_modules` nejde: 87 MB / 13 000 souborů → nasazení padá. Bundle ~3 MB.
- Bundle potřebuje shim `createRequire` (CommonJS závislosti Azure SDK volají `require`).

Ruční nasazení při ladění:

```bash
npm run build && npm run build:api
export SWA_CLI_DEPLOYMENT_TOKEN=…
npx @azure/static-web-apps-cli@2 deploy apps/portal/dist \
  --api-location apps/api/deploy --api-language node --api-version 20 \
  --env production --no-use-keychain
```

## Nastavení v Azure (Application settings)

| Klíč | Hodnota |
|---|---|
| `NODE_ENV` | `production` |
| `COSMOS_ENDPOINT`, `COSMOS_KEY` | účet `lf-page-db` |
| `COSMOS_DATABASE` | `izi-db` |
| `COSMOS_THROUGHPUT` | `400` (prázdné na serverless účtu) |
| `ALLOWED_ORIGINS`, `APP_URL` | `https://www.fridrich.cloud` |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | schránka |
| `CONTACT_INBOX` | adresa pro poptávky |

`COOKIE_DOMAIN` zůstává prázdný (jeden origin).

## `staticwebapp.config.json`

Jeden `navigationFallback` na `index.html` (Vue Router si routu najde),
`exclude` pro `/api/*`, `/assets/*` a soubory – chybějící obrázek pak vrátí
poctivou 404, ne HTML.

## Související

- [Lokální vývoj](lokalni-vyvoj.md) · [Monorepo](../architektura/monorepo.md) · [Data v Cosmos DB](../architektura/data-cosmos.md)
