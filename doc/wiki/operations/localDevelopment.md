---
title: Local development
type: operations
sources:
  - code: package.json, apps/api/local.settings.json.example, apps/portal/vite.config.ts
  - history: doc/architecture.md ch. 8 (commit 8db5e0a)
updated: 2026-09-15
---

# Local development

> Two processes: the Vite dev server (`:5173`) and Azure Functions (`:7071`).
> Vite proxies `/api` to Functions, so everything is on one origin during
> development too.

## Requirements

- Node.js 20+ (CI runs on 20)
- Database: Cosmos DB Emulator, or the remote `lf-page-db` (= production data!)
- Azure Functions Core Tools are **not installed globally** – they are a
  devDependency of `apps/api` (`node_modules/.bin/func`).

## Running

```bash
npm install            # also builds packages/shared and packages/weddy-shared
npm run dev:api        # build API + func start → http://localhost:7071
npm run dev:portal     # Vite → http://localhost:5173 (busy port → next one, printed on start)
```

| Address | Served by |
|---|---|
| `http://localhost:5173/` | portal |
| `http://localhost:5173/izi-weddy/…` | IziWeddy (same application) |
| `http://localhost:5173/api/*` | API via proxy to `:7071` |

Checks before committing: `npm run typecheck && npm run test && npm run build`.

> ⚠️ **After changing `packages/*`, rebuild them** (`npm run build -w packages/weddy-shared`
> or `npm run build`). Applications read `dist/`; without a build they see old types and schemas.

## API settings

Copy `apps/api/local.settings.json.example` → `local.settings.json` (the file is
in `.gitignore`). The template points to the emulator and contains its
**publicly known key** (not a secret). For the remote database, override
`COSMOS_ENDPOINT` and `COSMOS_KEY`.

Emulator in a container:

```bash
podman run --detach --name cosmos --publish 8081:8081 \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
```

- The emulator uses a self-signed certificate; `infrastructure/cosmos/client.ts`
  disables verification **only for localhost/127.0.0.1 and only for this client**.
  `NODE_TLS_REJECT_UNAUTHORIZED` is deliberately not used.
- Without a database the API starts, `/api/auth/me` returns `401` and input
  validation (`400`) works; anything that touches the database ends with `500` (`ECONNREFUSED`).
- The `azure.functions.webjobs.storage … Unhealthy` message is harmless (Azurite is not needed).

## E-mails

| Settings | Sender |
|---|---|
| `SMTP_HOST` + `SMTP_USER` + `SMTP_PASSWORD` | SMTP (nodemailer) – takes precedence |
| `ACS_CONNECTION_STRING` | Azure Communication Services |
| none | **console output** (outside production only) – the activation link and code can be copied from the `func start` output |

Incomplete SMTP settings crash the app on start. For Gmail use an app password;
port 587 = STARTTLS, 465 = TLS.

> ⚠️ **Rate limit during development:** locally there are no IP headers, so all
> requests fall under the key `unknown` – 5 registrations/h and 20 logins/15 min
> **combined**. A `429` usually does not mean a bug. Fix: wait, clear the
> `rateLimits` container, or send `x-forwarded-for` with different addresses.

## Related

- [Deployment](deployment.md) · [Data in Cosmos DB](../architecture/dataCosmos.md) · [Monorepo](../architecture/monorepo.md)
