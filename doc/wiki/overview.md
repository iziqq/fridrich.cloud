---
title: Project overview
type: overview
sources:
  - history: doc/README.md (commit 8db5e0a)
  - code: the whole repository
updated: 2026-09-15
---

# fridrich.cloud project overview

> A monorepo for `www.fridrich.cloud`: the presentation portal of Libor Fridrich
> (custom software development) and the products under it. **One Vue
> application** on one domain, **one API** on Azure Functions split into domains,
> **Cosmos DB**. Deployed to Azure Static Web Apps Free.

## Parts

| Part | Address | Description | Status |
|---|---|---|---|
| **Portal** | `/` | Presentation – about me, services, development process, projects, contact | ✅ done |
| **Identity** | `/prihlaseni`, `/registrace`, `/ucet` | Passwordless account shared by everything, self-service deletion | ✅ done |
| **IziWeddy** | `/izi-weddy` | Wedding planner – couple, guests, planning, budget | ✅ done |
| **Legal** | `/ochrana-osobnich-udaju`, `/obchodni-podminky` | Privacy policy and terms | ✅ done |
| **IziBudgy** | `/izi-budgy` | Household budget | 🕓 TODO – specification missing |
| **API** | `/api` | `identity`, `contact`, `weddy` – 28 endpoints | ✅ done |
| **Retention scheduler** | GitHub Actions | Daily deletion of inactive accounts | ✅ done – needs `MAINTENANCE_TOKEN` set up |

> ℹ️ Personal data is collected under the privacy policy; contact messages expire
> after a year and inactive accounts are deleted after a year. Everything can be
> switched off by `PERSONAL_DATA_COLLECTION_ENABLED` – [architecture/personalData.md](architecture/personalData.md).

```
                    ┌──────────────────────────────────────┐
                    │  www.fridrich.cloud – one origin      │
                    └──────────────────┬───────────────────┘
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        ▼              ▼               ▼               ▼              ▼
       /            /prihlaseni    /izi-weddy      /izi-budgy       /api
     Portal          identity       IziWeddy        IziBudgy     identity · contact
                                                                  · weddy · (budgy)
```

## Technology

Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Pinia, Vue Router ·
Azure Functions v4 (Node 20) · Azure Cosmos DB (NoSQL) · **Valibot** (types and
validation) · Azure Static Web Apps · npm workspaces.

Language: documentation in English, product UI and user-facing messages in Czech.

## Progress

1. ✅ Project split and documentation
2. ✅ Portal – monorepo skeleton, `packages/design`, `apps/portal`
3. ✅ Backend – `identity`, `weddy`, contact form
4. ✅ Portal sign-in – passwordless registration and e-mail code
5. ✅ IziWeddy frontend
6. ✅ Merge into one application – products as portal subtrees
7. ✅ Deployment – GitHub Actions + SWA CLI
8. ✅ Domain architecture on FE and BE, endpoint per file, Valibot, LLM Wiki in English (2026-09-15)
9. ⬜ IziBudgy – write the specification, then implement

## Where next

- How the code is organised: [architecture/domains.md](architecture/domains.md)
- How to add an endpoint: [architecture/endpoints.md](architecture/endpoints.md)
- Catalog of all pages: [index.md](index.md)
