---
title: Lokální vývoj
type: provoz
sources:
  - kód: package.json, apps/api/local.settings.json.example, apps/portal/vite.config.ts
  - historie: doc/architecture.md kap. 8 (commit 8db5e0a)
updated: 2026-09-15
---

# Lokální vývoj

> Dva procesy: Vite dev server (`:5173`) a Azure Functions (`:7071`). Vite
> proxuje `/api` na Functions, takže i při vývoji je všechno na jednom originu.

## Požadavky

- Node.js 20+ (CI běží na 20)
- Databáze: Cosmos DB Emulator, nebo vzdálená `lf-page-db` (= produkční data!)
- Azure Functions Core Tools **se neinstalují globálně** – jsou devDependency
  `apps/api` (`node_modules/.bin/func`).

## Spuštění

```bash
npm install            # zároveň postaví packages/shared a packages/weddy-shared
npm run dev:api        # build API + func start → http://localhost:7071
npm run dev:portal     # Vite → http://localhost:5173 (obsazený port → další, vypíše ho)
```

| Adresa | Obslouží |
|---|---|
| `http://localhost:5173/` | portál |
| `http://localhost:5173/izi-weddy/…` | IziWeddy (stejná aplikace) |
| `http://localhost:5173/api/*` | API přes proxy na `:7071` |

Kontroly před commitem: `npm run typecheck && npm run test && npm run build`.

> ⚠️ **Po změně v `packages/*` je přestav** (`npm run build -w packages/weddy-shared`
> nebo `npm run build`). Aplikace čtou `dist/`, bez buildu vidí staré typy a schémata.

## Nastavení API

Zkopírovat `apps/api/local.settings.json.example` → `local.settings.json`
(soubor je v `.gitignore`). Vzor míří na emulátor a nese jeho **veřejně známý
klíč** (není tajemství). Pro vzdálenou databázi přepsat `COSMOS_ENDPOINT`
a `COSMOS_KEY`.

Emulátor v kontejneru:

```bash
podman run --detach --name cosmos --publish 8081:8081 \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
```

- Emulátor má self-signed certifikát; `infrastructure/cosmos/client.ts` vypne
  kontrolu **jen pro localhost/127.0.0.1 a jen pro tento klient**.
  `NODE_TLS_REJECT_UNAUTHORIZED` se schválně nepoužívá.
- Bez databáze API nastartuje, `/api/auth/me` vrátí `401` a validace vstupů
  (`400`) funguje; cokoli, co sáhne do databáze, skončí `500` (`ECONNREFUSED`).
- Hláška `azure.functions.webjobs.storage … Unhealthy` nevadí (Azurite není potřeba).

## E-maily

| Nastavení | Odesílatel |
|---|---|
| `SMTP_HOST` + `SMTP_USER` + `SMTP_PASSWORD` | SMTP (nodemailer) – má přednost |
| `ACS_CONNECTION_STRING` | Azure Communication Services |
| nic | **výpis do konzole** (jen mimo produkci) – aktivační odkaz i kód jde zkopírovat z výpisu `func start` |

Neúplné SMTP nastavení shodí aplikaci při startu. U Gmailu heslo aplikace;
port 587 = STARTTLS, 465 = TLS.

> ⚠️ **Rate limit při vývoji:** lokálně chybí hlavičky s IP, všechny požadavky
> padají pod klíč `unknown` – 5 registrací/h a 20 přihlášení/15 min
> **dohromady**. `429` obvykle neznamená chybu v kódu. Řešení: počkat, vyčistit
> kontejner `rateLimits`, nebo posílat `x-forwarded-for` s různou adresou.

## Související

- [Nasazení](nasazeni.md) · [Data v Cosmos DB](../architektura/data-cosmos.md) · [Monorepo](../architektura/monorepo.md)
