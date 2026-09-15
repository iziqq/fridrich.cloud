---
title: Decisions and open questions
type: decisions
sources:
  - raw/2026-09-15-domainArchitecture.md
  - raw/2026-09-15-docsInEnglish.md
  - raw/2026-09-15-camelCaseFileNames.md
  - raw/iziweddySpec.md (ch. 12), raw/portalSpec.md (ch. 11)
  - history: doc/architecture.md (Open questions, Answered)
updated: 2026-09-15
---

# Decisions and open questions

> A register of decisions that shape the code and of questions waiting for an
> answer. A new decision is added **at the top** with a date and a link to its
> source; superseded ones are not deleted, just marked with what replaced them.

## Decisions

| Date | Decision | Why | Detail |
|---|---|---|---|
| 2026-09-15 | **Documentation file names in camelCase** (`weddyGuests.md`); dated raw sources keep an ISO date prefix; `README.md`, `CLAUDE.md`, `index.md`, `log.md` stay conventional | Owner's request; consistent with camelCase TypeScript modules such as `createGuest.endpoint.ts` | [raw/2026-09-15-camelCaseFileNames.md](../raw/2026-09-15-camelCaseFileNames.md), [CLAUDE.md](../../CLAUDE.md#page-conventions) |
| 2026-09-15 | **All documentation in English** – wiki, raw sources, READMEs, `CLAUDE.md`; Czech input is stored as an English translation. Product UI texts stay Czech. | Owner's request; one documentation language for people and agents | [raw/2026-09-15-docsInEnglish.md](../raw/2026-09-15-docsInEnglish.md) |
| 2026-09-15 | **Documentation as an LLM Wiki** (Karpathy): `doc/raw` immutable sources, `doc/wiki` pages maintained by the agent, schema in `CLAUDE.md` | Knowledge accumulates and is kept up to date instead of being re-derived from code and stale documents | [CLAUDE.md](../../CLAUDE.md), [index](index.md) |
| 2026-09-15 | **Domain-oriented FE and BE** – `identity`, `contact`, `weddy/{wedding,guests,planning,budget}` | The same domain map in API and frontend; a subdomain change happens in one place | [domains.md](architecture/domains.md) |
| 2026-09-15 | **The couple is part of `wedding`, not a `couple` subdomain** | Value objects without their own lifecycle, one document, one form, one endpoint | [domains.md](architecture/domains.md#weddy-subdomains) |
| 2026-09-15 | **One file per endpoint** on FE and BE (`<name>.endpoint.ts`), with request and response schemas inside | Everything about the HTTP contract in one place; business logic stays in the domain | [endpoints.md](architecture/endpoints.md) |
| 2026-09-15 | **Endpoint schemas are written separately on FE and BE, from shared building blocks** | The brief asks for request/response in the endpoint file; field rules still exist only once in the shared kernel. Alternative (endpoint contract in a shared package) rejected for locality. | [endpoints.md](architecture/endpoints.md#keeping-fe-and-be-in-sync) |
| 2026-09-15 | **All data types via Valibot**, request validation on BE, request and response validation on FE | One source of truth for type and validation; a drifted contract is noticed at runtime | [valibot.md](architecture/valibot.md) |
| 2026-09-15 | **The Budget screen reads the `getBudget` endpoint**, the section overview still calculates locally | The `budget` subdomain talks to its endpoint; the section overview needs instant recalculation | [weddyBudget.md](domains/weddyBudget.md) |
| 2026-09-15 | **Endpoints are registered grouped by route** (`registerEndpoints`) | Azure Functions does not allow two functions on the same route with different methods | [endpoints.md](architecture/endpoints.md) |
| earlier | **Own `identity` module**, not Entra External ID | A third-party login screen could not match the look | [identity.md](domains/identity.md) |
| earlier | **No passwords** – registration with name and e-mail, login with a code | A password adds nothing, recovery depends on e-mail anyway; the whole password security layer disappears | [identity.md](domains/identity.md) |
| earlier | **Paths under `www.fridrich.cloud`, not subdomains** | One origin: no CORS, no cookie via `Domain=.fridrich.cloud`, one certificate | [monorepo.md](architecture/monorepo.md) |
| earlier | **One frontend application**, products as route subtrees | Shares identity, tokens and types; separate builds meant proxies, path rewrites and more deployments | [frontend.md](architecture/frontend.md) |
| earlier | **API as SWA Free managed functions**, not a standalone Function App | Free tier; a standalone Function App requires Standard | [deployment.md](operations/deployment.md) |
| earlier | **Deployment via SWA CLI**, not the GitHub action | The action cannot skip the API build and failed without explanation | [deployment.md](operations/deployment.md) |
| earlier | **Development and production share the `izi-db` database** | 400 RU/s account cap – a second database does not fit | [dataCosmos.md](architecture/dataCosmos.md) |
| earlier | **A family has no record of its own** – a group of guests with the same `family.id` | The side stays on the guest, filters and statistics work unchanged | [weddyGuests.md](domains/weddyGuests.md) |
| earlier | **No client names on the website**, industries only | Contractual restrictions | [portal.md](domains/portal.md) |
| earlier | Portal menu: *O mně · Služby · Vývoj · Projekty · Kontakt · Přihlásit se*; no testimonials yet | *Vývoj* (Development) = how the collaboration works, *Projekty* (Projects) = own products | [portal.md](domains/portal.md) |

## Open questions

| # | Area | Question | Proposal |
|---|---|---|---|
| 1 | platform | Should the products be paid? | Free for now |
| 2 | platform | Install to home screen (PWA)? | Yes for products (`vite-plugin-pwa`), not for the portal |
| 3 | platform | Multiple languages in the UI? | Czech for now, keep texts outside components |
| 4 | platform | Separate development and production databases? | When traffic grows – raise the account cap, second database |
| 5 | weddy | Can a plan be shared by several users (both partners)? | The domain supports it (`Wedding.shareWith`), an endpoint and invitations are missing |
| 6 | weddy | Can several items be accepted in one section? | Allow for now, maybe show a warning |
| 7 | weddy | `updateGuest` on a family member overwrites the side for that member only (the UI does not offer it – members are edited via the family form – but the API does) | Consider keeping the side in `Guest.update` for family members |
| 8 | portal | Analytics? | Cookieless – Application Insights or Plausible |
| 9 | portal | Blog / articles? | Not for now |
| 10 | portal | Portrait photo and company registration number (IČO) in the footer | To be supplied by the owner |
| 11 | budgy | Questions before the specification | [budgy.md](domains/budgy.md#questions-before-the-specification) |

Answered and superseded (history): e-mails – originally proposed Azure
Communication Services, SMTP is used in production (ACS remains an alternative);
UI library for IziWeddy – custom CSS on top of `@fridrich/design`, no library.
