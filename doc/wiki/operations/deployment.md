---
title: Deployment
type: operations
sources:
  - code: .github/workflows/azure-static-web-apps.yml, apps/api/scripts/build-deploy.mjs, apps/portal/public/staticwebapp.config.json
  - history: doc/architecture.md ch. 9 (commit 8db5e0a)
updated: 2026-09-15
---

# Deployment

> One **Azure Static Web App (Free)** on `www.fridrich.cloud`: the website from
> `apps/portal/dist` and the API as **managed functions** from `apps/api/deploy`.
> Deployed by GitHub Actions via the SWA CLI. Goal: stay within free tiers.

## Services

| Part | Service | Tier |
|---|---|---|
| Frontend | Azure Static Web App `LiborFridrich` (resource group `lf-page`) | Free |
| API | managed functions of the same SWA on `/api` | part of Free |
| Database | Cosmos DB `lf-page-db`, database-level shared capacity | Free tier (1000 RU/s, 25 GB) |
| E-mails | SMTP | own mailbox |

> ⚠️ **The API must not be a standalone Function App** – linking your own
> Functions app is a Standard plan feature (~$9/month). Consequences: no managed
> identity (Cosmos via `COSMOS_KEY`), no Key Vault references, HTTP triggers only,
> runtime `node:20` from `staticwebapp.config.json`.

## Pipeline (`.github/workflows/azure-static-web-apps.yml`)

1. `npm ci` (builds the shared packages)
2. `npm run typecheck`, `npm run lint`, `npm run test`
3. **Safeguard: at least 60 API tests** – `node --test` with no files found ends
   with zero tests and exit code 0. 117 tests today.
4. `npm run build` → `apps/portal/dist` (including `staticwebapp.config.json` from `public/`)
5. `npm run build:api` → `apps/api/deploy`
6. `npx @azure/static-web-apps-cli@2 deploy` – a PR goes to environment `pr-<number>`
   (Azure turns it into `pr123`, Free supports 3), `main` to `production`.
   Can also be triggered manually (`workflow_dispatch`).

The only secret: `AZURE_STATIC_WEB_APPS_API_TOKEN` (Manage deployment token).

> ⚠️ **Deployment uses the SWA CLI, not the `Azure/static-web-apps-deploy@v1` action** –
> the action cannot skip the API build and failed with `An unknown exception has occurred`.

## The API as a self-contained bundle

Managed functions do not install dependencies and the workspace packages are not
on npm. `scripts/build-deploy.mjs` therefore uses esbuild to combine
**everything** (code, `@fridrich/*`, `valibot`, Azure SDK) into one `index.js`;
only `@azure/functions` stays external.

- Shipping `node_modules` does not work: 87 MB / 13,000 files → deployment fails. The bundle is ~3 MB.
- The bundle needs a `createRequire` shim (CommonJS dependencies of the Azure SDK call `require`).

Manual deployment while debugging:

```bash
npm run build && npm run build:api
export SWA_CLI_DEPLOYMENT_TOKEN=…
npx @azure/static-web-apps-cli@2 deploy apps/portal/dist \
  --api-location apps/api/deploy --api-language node --api-version 20 \
  --env production --no-use-keychain
```

## Azure settings (Application settings)

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `COSMOS_ENDPOINT`, `COSMOS_KEY` | account `lf-page-db` |
| `COSMOS_DATABASE` | `izi-db` |
| `COSMOS_THROUGHPUT` | `400` (empty on a serverless account) |
| `ALLOWED_ORIGINS`, `APP_URL` | `https://www.fridrich.cloud` |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | mailbox |
| `CONTACT_INBOX` | address for enquiries |
| `MAINTENANCE_TOKEN` | random secret (`openssl rand -hex 32`) for the retention scheduler; the same value as the GitHub secret |

`COOKIE_DOMAIN` stays empty (single origin).

## Retention scheduler (`.github/workflows/data-retention.yml`)

Daily at 03:17 UTC (and manually via `workflow_dispatch`) it calls
`POST https://www.fridrich.cloud/api/maintenance/account-retention` with header
`x-maintenance-token` from repository secret `MAINTENANCE_TOKEN`. It deletes
accounts inactive for a year after a 30-day warning ([personalData.md](../architecture/personalData.md#retention-scheduler)).

- A timer trigger is not available on SWA Free managed functions – hence GitHub Actions.
- The token must be set **in both places**; missing on Azure → `401`, missing in GitHub → the job fails.
- GitHub disables scheduled workflows after 60 days without repository activity – re-enable in the Actions tab.

## `staticwebapp.config.json`

A single `navigationFallback` to `index.html` (Vue Router resolves the route),
with `exclude` for `/api/*`, `/assets/*` and files – a missing image then returns
an honest 404 instead of HTML.

## Related

- [Local development](localDevelopment.md) · [Monorepo](../architecture/monorepo.md) · [Data in Cosmos DB](../architecture/dataCosmos.md) · [Personal data](../architecture/personalData.md)
