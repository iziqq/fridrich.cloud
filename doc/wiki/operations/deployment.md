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
>
> ⚠️ **Deployment did not succeed from at least 2026-09-11** – the deploy step failed with
> `An unknown exception has occurred`. **Root cause found 2026-09-15:** the deployment token secret
> ended with a newline. See [Deployment failure](#deployment-failure-an-unknown-exception-has-occurred).

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
> runtime `node:22` from `staticwebapp.config.json`.

> ⚠️ **Node version is set in four places and must match:** `platform.apiRuntime` in
> `staticwebapp.config.json`, `--api-version` and `setup-node` in the workflow, esbuild
> `target` in `build-deploy.mjs` (plus `engines` in the root `package.json`). Node 20 lost
> Azure Functions support on 2026-04-30; the project moved to Node 22 (supported until 2027-04).

## Pipeline (`.github/workflows/azure-static-web-apps.yml`)

1. Node 22, `npm ci` (builds the shared packages)
2. `npm run typecheck`, `npm run lint`, `npm run test`
3. **Safeguard: at least 60 API tests** – `node --test` with no files found ends
   with zero tests and exit code 0. 117 tests today.
4. `npm run build` → `apps/portal/dist` (including `staticwebapp.config.json` from `public/`)
5. `npm run build:api` → `apps/api/deploy`
6. **Package contents** – file counts, sizes and `deploy/package.json` printed to the log.
7. `npx @azure/static-web-apps-cli@2 deploy … --verbose=silly` – a PR goes to environment `pr-<number>`
   (Azure turns it into `pr123`, Free supports 3), `main` to `production`.
   Can also be triggered manually (`workflow_dispatch`), optionally with **`without_api`** –
   a diagnostic run that deploys only the website to the preview environment `diagnostika`, and
   **`client_version`** (`latest` default, `stable`, `backup`) – the StaticSitesClient build, passed to the
   CLI as the undocumented `SWA_CLI_DEPLOY_BINARY_VERSION` (push and PR runs use `latest`).

The only secret: `AZURE_STATIC_WEB_APPS_API_TOKEN` (Manage deployment token). The step
**Deployment token** strips whitespace from it and exports `SWA_CLI_DEPLOYMENT_TOKEN`; if anything was
stripped it prints a warning – paste the token again without a trailing newline.

> ⚠️ **Deployment uses the SWA CLI, not the `Azure/static-web-apps-deploy@v1` action** –
> the action cannot skip the API build. Note that it failed with the same
> `An unknown exception has occurred` as the CLI does today, so the switch did not fix the
> deployment (the earlier claim that the CLI works was never confirmed by a green run).

## Deployment failure: "An unknown exception has occurred"

> ✅ **Root cause:** the secret `AZURE_STATIC_WEB_APPS_API_TOKEN` ended with a newline. StaticSitesClient
> builds the header `Authorization: token <value>`, and a newline makes it invalid
> (`System.FormatException: The format of value 'token ***⏎' is invalid` in
> `ContentDistributionClient.InitializeClient`). The `stable` client (2026-05-21) swallowed the exception;
> the `latest` client (2026-08-05) printed it. Fixed by the **Deployment token** step (whitespace stripped)
> – re-save the secret without the newline anyway. The investigation below is kept as history: the Azure
> regression #1750 has the same message but was **not** our cause.

| What we know | Evidence |
|---|---|
| Every workflow run since 2026-09-11 that got past the checks failed in the deploy step | GitHub Actions history (12 runs, commits `a2f632e` … `ac9c085`) |
| It fails inside `StaticSitesClient` at "Preparing deployment", before upload; the inner exception is swallowed | CLI 2.0.10 log; same message with the GitHub action |
| The API bundle itself is valid | locally `func start` in `apps/api/deploy` (Node 22) indexes all 20 functions |
| Microsoft has an open platform-side regression with the same symptom since 2026-05/06 | [static-web-apps#1750](https://github.com/Azure/static-web-apps/issues/1750), [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5929128/swa-fails-immediately-after-deployment-with-the-sw) |
| The app still requested the retired `node:20` runtime | fixed 2026-09-15 → `node:22` – **did not help**: the next run failed the same way |
| The client passes validation and gets a `DeploymentId` (e.g. `8cba83a8-46df-4e39-9f12-ba310f96a289`), then fails – the failure is in the Azure deployment backend, matching #1750 | run after the Node 22 change with `--verbose=silly` |
| **Deploying only the website (no API) fails the same way** – the API bundle is not the cause | diagnostic run `without_api`, `DeploymentId: abefbcbc-809c-4eb8-a53d-27435af28c95`, environment `diagnostika` |
| The CLI downloads StaticSitesClient `stable` (build 689a6c1, 2026-05-21) by default; a newer `latest` (d3c9158, 2026-08-05) exists and none of the public reports tried it | CLI 2.0.10 verbose log; `SWA_CLI_DEPLOY_BINARY_VERSION` read in `core/deploy-client.js` |
| A similar case ("Failure during content distribution", one resource only) cleared itself after about a week, cause undocumented | [Microsoft Q&A, 2026-08](https://learn.microsoft.com/en-ie/answers/questions/5973371/static-web-app-deployment-consistently-fails-with) |
| "missing property jobs.build_and_deploy_job" in the log is only a warning | the CLI looks for the job name the portal generates; it does not affect deployment |

Diagnosis, in this order:

1. **Push the Node 22 change** and read the deploy log (`--verbose=silly` prints the
   deployment ID and the last step).
2. If it still fails, **run the workflow manually with `without_api`**. Success → the problem is
   the API part (runtime, bundle); failure → the Static Web App / Azure side.
3. Azure side: check the resource's region and **Deployment history** in the portal,
   regenerate the deployment token (update the GitHub secret), and if it keeps failing,
   **create a new Static Web App in a different region** (Free, same repo, new token, move the custom
   domain and Application settings) or open an Azure support request with the deployment ID.

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
| `PSEUDONYM_PEPPER` | random secret (`openssl rand -hex 32`) for fingerprints of values that are only compared (IP, the e-mail of a pending invitation). **Required in production**; changing it invalidates existing fingerprints ([security.md](../architecture/security.md)) |

`COOKIE_DOMAIN` stays empty (single origin).

## Retention scheduler (`.github/workflows/data-retention.yml`)

Daily at 03:17 UTC (and manually via `workflow_dispatch`) it calls
`POST https://www.fridrich.cloud/api/maintenance/account-retention` with header
`x-maintenance-token` from repository secret `MAINTENANCE_TOKEN`. It deletes
accounts inactive for a year after a 30-day warning ([personalData.md](../architecture/personalData.md#retention-scheduler)).

- A timer trigger is not available on SWA Free managed functions – hence GitHub Actions.
- The token must be set **in both places**; missing on Azure → `401`, missing in GitHub → the job fails.
  Both ways the workflow run goes red (`--fail-with-body`), so the Actions history is where to look
  when in doubt. Checking the Azure side without revealing values:
  `az staticwebapp appsettings list --name LiborFridrich --resource-group lf-page --query "keys(properties)"`.
- GitHub disables scheduled workflows after 60 days without repository activity – re-enable in the Actions tab.

## `staticwebapp.config.json`

A single `navigationFallback` to `index.html` (Vue Router resolves the route),
with `exclude` for `/api/*`, `/assets/*` and files – a missing image then returns
an honest 404 instead of HTML.

## Related

- [Local development](localDevelopment.md) · [Monorepo](../architecture/monorepo.md) · [Data in Cosmos DB](../architecture/dataCosmos.md) · [Personal data](../architecture/personalData.md)
