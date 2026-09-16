# CLAUDE.md

Rules for AI agents working in this repository: how the knowledge base is
organised and maintained, and how code must be written. Detailed, up-to-date
knowledge lives in the wiki – this file is the **schema**.

## Project overview

`www.fridrich.cloud` – a presentation portal and products under it, in one
npm-workspaces monorepo:

- **Frontend** – `apps/portal`: one Vue 3 app (Composition API, `<script setup lang="ts">`, Vite, Pinia, Vue Router). Products (IziWeddy, IziBudgy) are route subtrees.
- **Backend** – `apps/api`: one Azure Functions app (Node.js, programming model v4, HTTP triggers only), TypeScript.
- **Database** – Azure Cosmos DB (NoSQL API).
- **Shared kernel** – `packages/shared`, `packages/weddy-shared`: Valibot schemas, enums, pure calculations used by both apps.
- **Types and validation** – [Valibot](https://valibot.dev) everywhere.

Both backend and frontend are organised **by domain**, with the same domain
names on both sides. Current domains: `identity`, `contact`,
`weddy/{wedding,guests,planning,budget}`, `budgy` (TODO).

---

## Knowledge base (LLM Wiki)

Documentation follows Andrej Karpathy's **LLM Wiki** pattern: instead of
re-deriving knowledge from code and stale docs on every task, the agent keeps
a persistent, interlinked wiki up to date.

### Layers

| Layer | Path | Owner | Rule |
|---|---|---|---|
| Raw sources | `doc/raw/` | the user | Immutable. Read, never edit – not even to fix a stale fact or a broken link. |
| Wiki | `doc/wiki/` | the agent | Compiled, current knowledge. The agent creates and updates pages. |
| Schema | `CLAUDE.md` | user + agent | This file. Change only when conventions change, and log it. |

### Language

**All documentation is written in English** – wiki pages, raw sources, READMEs,
this file. When the user gives input in Czech (a brief, a spec, a decision),
store it in English: a faithful translation in `doc/raw/`, English prose in the
wiki. Keep talking to the user in their language. Product content is Czech and
English (see rules 28–32): Czech is the source catalog, routes such as
`/prihlaseni` and the legal documents stay Czech only; when documentation quotes
a Czech UI string, add the English meaning in parentheses – `Návrh (Draft)`.

Key files: `doc/wiki/index.md` (catalog of every page with a one-line summary
and date) and `doc/wiki/log.md` (append-only chronology).

### Before any task – query

1. Read `doc/wiki/index.md`, open the pages relevant to the task.
2. Only then read code. The wiki tells you where things are and why.
3. If the wiki and code disagree, **code wins for behaviour**; fix the wiki page
   in the same change and note the correction in the log.
4. A useful answer to a non-trivial question (analysis, comparison, how-to) can
   be filed back as a new wiki page – ask the user if unsure.

### Ingest – when a new source arrives

A new source is a spec, a requirements message, a decision from the user.

1. Save it to `doc/raw/` – verbatim if it is in English, otherwise as a faithful English translation (`YYYY-MM-DD-shortName.md` with a YAML header: title, type: source, date, author, language) – and list it in `doc/raw/README.md`.
2. Discuss the key takeaways with the user if anything is ambiguous.
3. Update every affected page (typically several: domain pages, architecture, `decisions.md`); create pages for new concepts or domains.
4. Update `doc/wiki/index.md`.
5. Append a log entry.

### Change – when code changes

Any change to architecture, a domain rule, an endpoint, a schema, a container,
a script or deployment **must update the wiki in the same change**: the
relevant page(s), the `updated` date in their header, the index row, and a log
entry (`change`). Pure refactors with no knowledge impact need no entry.

### Lint – periodically or when asked

Check for: contradictions between pages, claims contradicted by code, stale
statements superseded by newer sources, pages missing from the index, orphan
pages without inbound links, concepts mentioned without their own page, broken
relative links. Fix what is clear, list the rest as open questions in
`doc/wiki/decisions.md`, append a `lint` log entry.

### Page conventions

- YAML header: `title`, `type` (`overview | concept | domain | operations | decisions`), `sources` (raw files and/or `code: path`), `updated: YYYY-MM-DD`.
- First block: `# Title` followed by a one-to-three sentence `>` summary.
- Tables for rules, fields and endpoints; code paths in backticks; `mermaid` for flows.
- Explain **why**, not only what – decisions and their trade-offs are the most valuable content.
- Relative Markdown links (`../domains/weddy.md`), ending with a `## Related` section. They work on GitHub, in VS Code and in Obsidian.
- One topic per page. Architecture concepts in `architecture/`, business domains in `domains/` (`<domain><Subdomain>.md`, e.g. `weddyGuests.md`), operations in `operations/`, decisions and open questions in `decisions.md` (newest first), project summary in `overview.md`.
- **File names are English camelCase**: `dataCosmos.md`, `localDevelopment.md`, `iziweddySpec.md`. Folder names are single lowercase words (`architecture`, `domains`). Dated raw sources keep the ISO date prefix for sorting: `2026-09-15-domainArchitecture.md`. Exceptions are conventional names: `README.md`, `CLAUDE.md`, `index.md`, `log.md`. When renaming, update every link (wiki, READMEs, code comments).

### Log format

```
## [YYYY-MM-DD] <ingest|query|lint|change> | <short title>
```

Followed by a few bullets: source, decisions, changed code, touched pages.
Last entries: `grep "^## \[" doc/wiki/log.md | tail -5`.

---

## Architecture rules

Details: `doc/wiki/architecture/domains.md`, `endpoints.md`, `valibot.md`,
`backend.md`, `frontend.md`.

### Domains

1. **Organise by domain, not by technical layer.** A (sub)domain has the same name in `packages/*-shared`, `apps/api` and `apps/portal`.
2. **Business logic always lives in the domain** – domain objects and domain functions in `apps/api/src/domain`, pure shared rules and calculations in `packages/*-shared`. Never in endpoint files, Vue components or stores. Access checks belong there too: an IziWeddy plan is guarded by the aggregate (`Wedding.assertCanRead/assertCanEdit/assertCanManageSettings` through `loadWeddingFor`), and the frontend only hides what the API would refuse.
3. **Domains do not call each other.** They share only the user identity (`userId`). Subdomains of `weddy` may depend on the root `wedding` (access check via `loadWeddingFor`). A cross-domain effect goes through a port of the triggering domain wired in `infrastructure/container.ts` – account deletion calls `UserDataEraser`, registration calls `UserRegistrationListener`, and weddy reads accounts through its own `UserDirectory` port.
4. **Composition over inheritance** – no abstract base classes between domain objects.

### Endpoints – one file per endpoint

5. Every endpoint has **one file on the backend and one on the frontend**, both named `<name>.endpoint.ts` (`createGuest.endpoint.ts`), placed in their domain folder:
   - backend: `apps/api/src/endpoints/<domain>/[<subdomain>/]`
   - frontend: `apps/portal/src/<domain>/[<subdomain>/]endpoints/`
6. The file contains everything about the HTTP contract: method, path, Valibot schemas `<Name>Request` / `<Name>Response` (+ `<Name>Params` / `<Name>Query`) and their types.
7. **Backend** endpoint = `defineEndpoint({ name, method, route, access, params?, query?, body?, response?, handle })` from `apps/api/src/http/endpoint.ts`, registered in `apps/api/src/index.ts`. `handle` only maps input → **one** use case → `{ status, body, headers }`. Session check (`access: 'user'`), input parsing (400) and error mapping are done by the wrapper.
8. **Frontend** endpoint = exported function `<name>(…)` that calls `callEndpoint` from `apps/portal/src/api/http.ts` with the request and response schemas. Components and stores never call `fetch` or `callEndpoint` directly.
9. Store actions are **not** named like endpoints (`addFamily` calls `createFamily`).
10. When a contract changes, change **both** endpoint files in the same commit.

### Types and validation – Valibot

11. **Every data type crossing the wire or coming from a user is derived from a Valibot schema** (`v.InferOutput` / `v.InferInput`). Do not hand-write interfaces for API data. Import as `import * as v from 'valibot'`.
12. Building blocks (field rules with message **keys**, entity and input schemas, enums, cs/en message catalogs) live in the shared kernel; endpoint files compose them.
13. Normalisation (trim, lowercase, rounding) belongs to schemas; defaults and state-dependent rules (access, one-time use, attempt counters) belong to the domain.
14. Domain methods accept **parsed, typed input** (`GuestInput`), never `unknown`. Value objects that are invariants on their own (`EmailAddress`) re-validate with the same schema.
15. Validation errors are `[{ field: 'dot.path', message }]` produced by `issuesToDetails`, where `message` is a message key; the frontend reads them via `ApiError.fieldErrors` and shows them with `translateMessage`.

### Backend layers

16. `endpoints → application → domain ← infrastructure`. The domain knows nothing about HTTP, Azure Functions or the Cosmos SDK.
17. Use cases (`application/<domain>/<subdomain>.ts`) receive dependencies as a parameter (`deps`), load aggregates, check access, call the domain, save.
18. Repository interfaces (ports) live in the domain (`<Aggregate>Repository.ts`); implementations in `infrastructure/cosmos`. Mapping between domain objects and Cosmos documents (partition key, `id`, `_ts`) happens only there.
19. Domain and use cases throw `DomainError` (`validation | unauthorized | forbidden | notFound | conflict | tooManyRequests`); translation to HTTP is only in `http/responses.ts`.

### Frontend

20. `view → store → endpoint file → api/http.ts`. A view may call an endpoint without a store when the result is not shared (e.g. registration, budget).
21. Pinia store (`<subdomain>.store.ts`) only for state shared across components/screens.
22. Use shared-kernel calculations (`calculateBudget`, `groupIntoFamilies`) instead of re-implementing them in components.
23. Product styles only under the product class (`.weddy`) – nothing on `:root`, no bare element selectors. Every product screen has exactly one `main#obsah`.
24. **Everything on the frontend is responsive** – every view and component (portal and products) must work on mobile, tablet and notebook. Styles are mobile-first: base CSS is the mobile layout, wider layouts are added with the **named breakpoints** defined once in `packages/design/src/breakpoints.css` (`@custom-media`, compiled by PostCSS in `apps/portal/postcss.config.js`):

    | Device | Width | Media query |
    |---|---|---|
    | Mobile | 360–767 px | base styles, no query |
    | Tablet | 768–1023 px | `@media (--tablet)` |
    | Notebook | ≥ 1024 px | `@media (--notebook)` |

    Never write a width in px in `@media`; if a component does not fit between breakpoints, fix the component (`minmax(0, 1fr)`, `flex-wrap`, `clamp()`), do not add a breakpoint. No horizontal scrolling at any width, touch targets at least 44 × 44 px, wide tables become card lists on mobile, content width is capped on notebook. Before finishing a frontend change, check the screen at 360, 768 and 1024 px. Details: `doc/wiki/architecture/frontend.md#responsive-layout-and-breakpoints`.

### Translations (i18n)

28. **No user-facing text in code.** Every visible string, `aria-label`, `title`, `placeholder` and `alt` in the portal goes through vue-i18n (`const { t } = useI18n()`); catalogs are `apps/portal/src/i18n/locales/<area>.ts`. Stores and plain TS return keys, components translate. Details: `doc/wiki/architecture/i18n.md`.
29. **Czech catalog is the source, English is typed from it** – `export const xEn: Catalog<typeof xCs>`. Every new key is added to both languages in the same change (typecheck fails otherwise). Czech plurals have four variants, English three; escape `@ { } |` in texts.
30. **Shared schemas and the API return message keys, never sentences.** Messages live in the subdomain file's `cs`/`en` catalog in `packages/*-shared`; schemas use the generated keys (`identityKeys.emailInvalid`, `guestsKeys.status[status]`). `DomainError` messages and `MessageResponse.message` are keys; the portal shows them with `translateMessage(key)`.
31. **E-mails are translated on the API** (`application/identity/emails.ts`, cs and en): e-mails of the current action use the request language (`requestLocale`, header `Accept-Language` sent by `callEndpoint`), scheduler e-mails use `User.locale`.
32. **Stays Czech:** routes and anchors, legal documents (`content/legal.ts`), code comments, the contact-form e-mail to the owner. Dates and currency are formatted with `currentLocale`.

### Personal data (GDPR)

25. **Personal data only as the privacy policy describes it.** The policy and terms live in `apps/portal/src/content/legal.ts`; retention periods and document versions are constants in `packages/shared/src/privacy.ts` used by both apps. Any change to what is collected, why, where or for how long must update the policy table in the same change and bump `PRIVACY_POLICY_VERSION` (terms: `TERMS_VERSION`).
26. **Everything that takes or stores personal data** (name, e-mail, phone, IP, people entered into a product) must be behind the switch `PERSONAL_DATA_COLLECTION_ENABLED` on **both** sides: endpoints in `personalDataEndpoints` (`apps/api/src/index.ts`), routes in `personalDataRoutes` (`apps/portal/src/router/routes.ts`), links, buttons and forms with `v-if`. Change the switch only when the owner asks.
27. **Every product that stores user data implements `UserDataEraser`** and registers it in `infrastructure/container.ts`, so account deletion and retention remove it. No analytics, tracking, third-party embeds or non-essential cookies without a policy update. Details: `doc/wiki/architecture/personalData.md`.

## Code conventions

- Prefer readable, explicit code over clever shortcuts.
- Refactor within a single method/object rather than splitting into many small helpers, unless asked.
- Keep files self-contained and easy to scan; the shared kernel has one file per subdomain.
- User-facing texts (UI, validation messages, e-mails) exist in Czech and English via message catalogs – never hard-coded. Code comments are in Czech; comments explain *why*.

## Commands

```bash
npm install                                  # dependencies + build of packages/shared and packages/weddy-shared
npm run dev:portal                           # Vite on :5173 (proxies /api to :7071)
npm run dev:api                              # build API + func start on :7071
npm run typecheck                            # tsc / vue-tsc in all workspaces
npm run test                                 # API tests (node:test over dist/)
npm run build                                # build all workspaces
npm run build:api                            # esbuild bundle of the API into apps/api/deploy
npm run build -w packages/weddy-shared       # rebuild a shared package after changing it
```

After changing anything in `packages/*`, rebuild it – apps consume `dist/`.
Before finishing a task run `npm run typecheck && npm run test && npm run build`.

> ⚠️ Local development may point to the **production** Cosmos DB
> (`apps/api/local.settings.json`). Do not send requests that write data unless
> the user asked for it.

## Testing

- Domain objects and use cases in isolation, with in-memory repositories from `apps/api/test/fakes.ts` (fakes, not a mocked Cosmos SDK) and `FixedClock`.
- Shared-kernel schema rules in `apps/api/test/schemas.test.ts` (assert the field paths).
- Endpoint wrapper only at request/response mapping level (`test/endpoint.test.ts`).
- CI requires at least 60 passing API tests.

## What not to do

- Do not put business logic into `*.endpoint.ts`, Vue components or stores.
- Do not use Cosmos SDK types outside `apps/api/src/infrastructure/cosmos`.
- Do not hand-write TypeScript interfaces for API data – derive them from Valibot schemas.
- Do not call `fetch`/`callEndpoint` outside frontend endpoint files.
- Do not create abstract classes to share behaviour between domain objects.
- Do not hard-code user-facing text in components, stores, schemas or API responses, and do not add a key to only one language.
- Do not add a form, endpoint or screen that collects personal data outside the `PERSONAL_DATA_COLLECTION_ENABLED` switch or without updating the privacy policy, and do not flip the switch without the owner.
- Do not build desktop-only layouts, write px widths in `@media` or add breakpoints beyond `--tablet` and `--notebook`.
- Do not edit files in `doc/raw/` (except storing a new source in English).
- Do not write documentation in Czech.
- Do not finish a change that affects architecture, domain rules or endpoints without updating the wiki, index and log.
