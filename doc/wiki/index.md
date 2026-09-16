# Wiki index

Catalog of all knowledge-base pages. **The agent reads this file first**, picks
the relevant pages and only then goes to the code. The index is updated on every
ingest or new page (rules in [CLAUDE.md](../../CLAUDE.md#knowledge-base-llm-wiki)).

Sources: [../raw/](../raw/README.md) · Change chronology: [log.md](log.md)

## Overview

| Page | Summary | Updated |
|---|---|---|
| [overview.md](overview.md) | What fridrich.cloud is, parts, status, technology, progress | 2026-09-15 |
| [decisions.md](decisions.md) | Register of decisions with reasons, and open questions | 2026-09-15 |

## Architecture (concepts)

| Page | Summary | Updated |
|---|---|---|
| [architecture/domains.md](architecture/domains.md) | Domain and subdomain map, where a domain lives on FE/BE, where logic belongs, dependency rules and cross-domain ports | 2026-09-16 |
| [architecture/endpoints.md](architecture/endpoints.md) | One file per endpoint: naming, `defineEndpoint` (BE), `callEndpoint` (FE), checklist for a new endpoint | 2026-09-15 |
| [architecture/valibot.md](architecture/valibot.md) | Types and validation with Valibot: where schemas live, naming, message keys, field errors, pitfalls | 2026-09-15 |
| [architecture/backend.md](architecture/backend.md) | `apps/api`: structure, request lifecycle, layer rules, tests, CORS | 2026-09-15 |
| [architecture/frontend.md](architecture/frontend.md) | `apps/portal`: domain folders, store vs. view, page shell with a bottom-anchored footer, responsive breakpoints, product routing and look, addresses | 2026-09-16 |
| [architecture/monorepo.md](architecture/monorepo.md) | Split principles, repository structure, shared packages, what goes where, scripts | 2026-09-15 |
| [architecture/i18n.md](architecture/i18n.md) | Translations: vue-i18n catalogs (cs/en), message keys from schemas and API, language choice, e-mails per locale | 2026-09-15 |
| [architecture/personalData.md](architecture/personalData.md) | GDPR: what collects personal data, legal documents, account deletion, retention scheduler, the switch | 2026-09-15 |
| [architecture/dataCosmos.md](architecture/dataCosmos.md) | Cosmos DB: containers, partition keys, TTL, RU/s capacity, repository rules | 2026-09-15 |

## Domains

| Page | Summary | Updated |
|---|---|---|
| [domains/identity.md](domains/identity.md) | Passwordless identity: flows, domain model, 8 endpoints incl. account deletion and retention, security rules | 2026-09-15 |
| [domains/contact.md](domains/contact.md) | Contact form: rules, honeypot, rate limit, 1-year retention, endpoint | 2026-09-15 |
| [domains/weddy.md](domains/weddy.md) | IziWeddy: subdomains, access via `loadWeddingFor`, routes, mobile UI principles | 2026-09-16 |
| [domains/weddyWedding.md](domains/weddyWedding.md) | Plans and the couple: dashboard in three shapes, settings screen, field rules, 6 endpoints, code | 2026-09-16 |
| [domains/weddyAccess.md](domains/weddyAccess.md) | Roles (admin / manager / viewer), where access is enforced, invitations by e-mail, 5 endpoints | 2026-09-16 |
| [domains/weddyGuests.md](domains/weddyGuests.md) | Guests and families: enums, family rules, list, statistics, 8 endpoints | 2026-09-15 |
| [domains/weddyPlanning.md](domains/weddyPlanning.md) | 11 sections, items, prices, 5 endpoints | 2026-09-15 |
| [domains/weddyBudget.md](domains/weddyBudget.md) | Budget from items: calculation, where it is computed, `getBudget` endpoint | 2026-09-15 |
| [domains/budgy.md](domains/budgy.md) | IziBudgy (TODO): rough core and questions before the specification | 2026-09-15 |
| [domains/portal.md](domains/portal.md) | Portal: content, binding rules, Glass design (dark + orange) tokens and components, accessibility | 2026-09-15 |

## Operations

| Page | Summary | Updated |
|---|---|---|
| [operations/localDevelopment.md](operations/localDevelopment.md) | Running locally, Cosmos DB emulator, e-mails to the console, rate limit during development | 2026-09-15 |
| [operations/deployment.md](operations/deployment.md) | Azure SWA Free, pipeline, API bundle, Node 22, Application settings, failing deployment diagnosis | 2026-09-15 |
