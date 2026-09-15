# Wiki log

Chronological record of operations on the knowledge base – **append only**,
older entries are never changed. The heading format is fixed so it can be filtered:

```
## [YYYY-MM-DD] <ingest|query|lint|change> | <short title>
```

Last five entries: `grep "^## \[" doc/wiki/log.md | tail -5`

---

## [2026-09-15] ingest | Wiki created from the existing documentation

- Introduced the LLM Wiki structure: `doc/raw/` (sources), `doc/wiki/` (pages,
  `index.md`, `log.md`), schema in `CLAUDE.md`.
- Moved to `raw/` unchanged: `iziweddy.md`, `portal.md`, `izibudgy.md`.
- `doc/architecture.md` and `doc/README.md` were dissolved into the pages
  `architecture/*`, `domains/identity.md`, `operations/*`, `overview.md`,
  `decisions.md` and deleted (original text: commit `8db5e0a`).
- Fixed contradictions with the code: there are 11 planning sections, not 8;
  e-mails go through SMTP (ACS is an alternative); a session lasts 30 days;
  IziWeddy chapters about a standalone repository marked as superseded.

## [2026-09-15] ingest | Domain architecture, endpoints and Valibot

Source: [raw/2026-09-15-domainArchitecture.md](../raw/2026-09-15-domainArchitecture.md)

Decisions (details in [decisions.md](decisions.md)):
- Domain-oriented FE and BE: `identity`, `contact`, `weddy/{wedding,guests,planning,budget}`.
  The brief mentioned a *Couple* domain – the couple stays in `wedding`
  (value objects of the aggregate), reasoning in [architecture/domains.md](architecture/domains.md).
- One `<name>.endpoint.ts` file per endpoint on FE and BE.
- All data types from Valibot schemas; validation on BE (params/query/body)
  and on FE (request before sending, response after receiving).

Code changes:
- `packages/shared`, `packages/weddy-shared` rewritten with Valibot, one file per
  subdomain (`wedding.ts`, `guests.ts`, `planning.ts`, `budget.ts`).
- API: `http/endpoint.ts` (`defineEndpoint`, `registerEndpoints`), 26 files in
  `src/endpoints/`, domain split into `domain/weddy/{wedding,guests,planning}`,
  family rules moved from the use case to `domain/weddy/guests/Family.ts`,
  use cases take typed input instead of `raw: unknown`. Removed
  `functions/*.ts` and `http/handler.ts`.
- Portal: `api/http.ts` (`callEndpoint`), domain folders `identity/`,
  `contact/`, `weddy/{wedding,guests,planning,budget}/` with `endpoints/` and
  `*.store.ts`. Removed `weddy/api.ts`. `BudgetView` reads `getBudget`.
- Tests: 78 → 97 (new `schemas.test.ts`, `endpoint.test.ts`).

New pages: `architecture/domains.md`, `architecture/endpoints.md`,
`architecture/valibot.md`, `architecture/backend.md`, `architecture/frontend.md`
and all `domains/*`.

## [2026-09-15] change | All documentation translated to English

Source: [raw/2026-09-15-docsInEnglish.md](../raw/2026-09-15-docsInEnglish.md)

- The whole wiki, `doc/README.md`, `doc/raw/README.md`, the root `README.md`
  and `CLAUDE.md` are now in English. The two earlier log entries above were
  translated as well (content unchanged).
- Raw sources translated to English with a note pointing to the Czech original
  in git history; literal Czech UI strings kept with an English gloss.
  The owner authorised this one-time edit of the raw layer.
- Files and folders renamed: `architektura/` → `architecture/`, `domeny/` →
  `domains/`, `provoz/` → `operations/`, `prehled.md` → `overview.md`,
  `rozhodnuti.md` → `decisions.md`, `domeny.md` → `domains.md`, `endpointy.md` →
  `endpoints.md`, `lokalni-vyvoj.md` → `local-development.md`, `nasazeni.md` →
  `deployment.md`; raw: `iziweddy-spec.md`, `portal-spec.md`,
  `izibudgy-brief.md`, `2026-09-15-domain-architecture.md`.
- New rule in `CLAUDE.md`: documentation in English, Czech input stored in
  English; product UI texts and validation messages stay Czech.
- Code comments that link to wiki pages updated to the new paths.

## [2026-09-15] change | Documentation file names in camelCase

Source: [raw/2026-09-15-camelCaseFileNames.md](../raw/2026-09-15-camelCaseFileNames.md)

- New convention: documentation file names are camelCase
  (`weddyGuests.md`, `localDevelopment.md`, `iziweddySpec.md`). Dated raw sources
  keep the ISO date prefix for sorting: `2026-09-15-domainArchitecture.md`.
  Conventional names stay as they are: `README.md`, `CLAUDE.md`, `index.md`, `log.md`.
- Renamed: `architecture/data-cosmos.md` → `dataCosmos.md`,
  `domains/weddy-{wedding,guests,planning,budget}.md` → `weddy{Wedding,Guests,Planning,Budget}.md`,
  `operations/local-development.md` → `localDevelopment.md`; raw:
  `iziweddy-spec.md` → `iziweddySpec.md`, `portal-spec.md` → `portalSpec.md`,
  `izibudgy-brief.md` → `izibudgyBrief.md`,
  `2026-09-15-domain-architecture.md` → `2026-09-15-domainArchitecture.md`,
  `2026-09-15-docs-in-english.md` → `2026-09-15-docsInEnglish.md`.
- All links (wiki, READMEs, code comments) updated; link targets inside older
  log entries were updated too so they keep working.
- Rule recorded in `CLAUDE.md` (Page conventions), `doc/raw/README.md` and `decisions.md`.

## [2026-09-15] ingest | Responsive frontend and breakpoints

Source: [raw/2026-09-15-responsiveFrontend.md](../raw/2026-09-15-responsiveFrontend.md)

- New convention: everything on the frontend is responsive, mobile-first, with
  two shared breakpoints – tablet `min-width: 768px`, notebook `min-width: 1024px`;
  mobile = base styles from 360 px. Values follow the portal specification
  (menu switch at 768 px, 1 / 2 / 3 column grid).
- `CLAUDE.md`: frontend rule 24 and a "What not to do" item.
- Touched pages: `architecture/frontend.md` (new section *Responsive layout and
  breakpoints*), `domains/weddy.md`, `domains/portal.md`, `decisions.md`
  (decision + open question 12), `index.md`; raw source listed in `doc/raw/README.md`.
- No code changed. Existing components still use `560`, `640`, `720` and `900px`
  breakpoints – recorded as open question 12.

## [2026-09-15] change | Breakpoints as @custom-media, components aligned

Source: owner's instruction to resolve the breakpoint question with best practice.

- Breakpoints defined once in `packages/design/src/breakpoints.css`
  (`@custom-media --tablet (min-width: 768px)`, `--notebook (min-width: 1024px)`);
  `apps/portal/postcss.config.js` compiles them with `postcss-custom-media` and
  `@csstools/postcss-global-data` (new dev dependencies of `apps/portal`).
- All width media queries moved to the named breakpoints: `560`/`640`/`720px`
  → `--tablet` (`WeddingForm`, `GuestsView`, `AccountView`, `BottomSheet`,
  `ServicesSection`, `DashboardView`, `PlanningView`); `900px` → `--tablet`
  for `ProjectsSection`, `--notebook` for the two-column `AboutSection` and
  `ContactSection`; `SiteNav`, `SiteFooter`, `ProcessSection` renamed only.
- Fix: the home page overflowed horizontally at 1024 px – the 6-column
  `ProcessSection` stepper is now 3 × 2 on notebook with `minmax(0, 1fr)`.
- Verified in headless Chrome: `/` at 360 / 768 / 1024 / 1440 px,
  `/prihlaseni`, `/registrace`, `/projekty/web-apps` at 360 / 768 / 1024 px –
  page width equals the viewport everywhere. Product screens behind login
  (`/ucet`, `/izi-weddy`) redirect to login and were not rendered.
- Open question 12 resolved and removed. Touched pages: `CLAUDE.md` (rule 24),
  `architecture/frontend.md`, `architecture/monorepo.md`, `domains/portal.md`,
  `domains/weddy.md`, `decisions.md`.

## [2026-09-15] ingest | No personal data collection until GDPR documentation exists

Source: [raw/2026-09-15-gdprNoDataCollection.md](../raw/2026-09-15-gdprNoDataCollection.md)

- New switch `PERSONAL_DATA_COLLECTION_ENABLED = false` in
  `packages/shared/src/privacy.ts`, used by both apps.
- API (`apps/api/src/index.ts`): identity, contact and all weddy endpoints moved to
  `personalDataEndpoints` and not registered; only `POST /api/auth/logout` stays.
  Verified by loading the compiled entry point with a stubbed `app.http`: 1 function registered.
- Portal: identity routes and `/izi-weddy/*` in `personalDataRoutes`, not registered
  (404); `SiteNav` hides *Přihlásit se* (Sign in) and no longer calls `/api/auth/me`;
  `ContactSection` shows only the e-mail and a `mailto:` button instead of the form;
  IziWeddy *Otevřít aplikaci* (Open app) hidden via `projects` content.
- Verified in headless Chrome (`vite preview`): no `<form>`/inputs and no `/api`
  requests on `/`, `/projekty/iziweddy`; `/prihlaseni`, `/registrace`, `/ucet`,
  `/izi-weddy`, `/izi-weddy/weddings/new` show the 404 page; no overflow at 360 px.
- Decisions: switch in the shared kernel instead of deleting code; the owner's
  e-mail stays as the contact. Open questions 13 (turning collection on) and 14
  (data already stored in Cosmos DB).
- `CLAUDE.md`: rule 25 *Personal data (GDPR)* and a "What not to do" item.
- New page `architecture/personalData.md`; touched `overview.md`, `decisions.md`,
  `architecture/{endpoints,frontend,backend}.md`, `domains/{portal,contact,identity,weddy}.md`, `index.md`.

## [2026-09-15] ingest | Privacy policy, terms, account deletion and retention scheduler

Source: [raw/2026-09-15-legalDocumentsAndRetention.md](../raw/2026-09-15-legalDocumentsAndRetention.md)

- Controller identification taken from ARES (IČO 08005788); answers: sole trader,
  Gmail as e-mail provider, contact messages kept 1 year, existing data kept.
- **Legal documents** (Czech product content): `apps/portal/src/content/legal.ts`,
  `views/LegalView.vue`, routes `/ochrana-osobnich-udaju` and `/obchodni-podminky`,
  footer links with IČO and address, sitemap. Retention values and versions come from
  `packages/shared/src/privacy.ts` (`TERMS_VERSION`, `PRIVACY_POLICY_VERSION`,
  `CONTACT_MESSAGE_RETENTION_DAYS`, `INACTIVE_ACCOUNT_*`).
- **Registration:** `acceptTerms` (`AcceptTermsSchema`) on FE and BE; `User` stores
  `termsVersion`/`termsAcceptedAt`; `toPublic` now maps the profile explicitly.
  Contact form consent sentence replaced by an information notice (legal basis is not consent).
- **Account deletion:** `DELETE /api/auth/account` (`deleteAccount`), `AccountView`
  *Smazat účet* with confirmation, `auth.closeAccount`. New identity port
  `UserDataEraser`, implemented by `eraseUserWeddyData` (sole-owner weddings deleted,
  shared ones `Wedding.removeOwner`), wired in `container.ts`. New repository methods
  `UserRepository.delete/listForRetention`, `TokenRepository.deleteAllForUser`.
- **Retention:** `contactMessages` TTL 365 days, with TTL reconciliation for existing
  containers in `initDatabase`. `User.lastSeenAt` (login, session use once a day);
  `applyAccountRetention` warns at 335 days and deletes at 365 days only after a full
  30-day warning. `POST /api/maintenance/account-retention` with new
  `access: 'maintenance'` (`x-maintenance-token` vs `MAINTENANCE_TOKEN`), always registered.
  Scheduler: `.github/workflows/data-retention.yml` (daily 03:17 UTC).
- `PERSONAL_DATA_COLLECTION_ENABLED` switched back to `true`.
- Tests 97 → 117 (`account.test.ts`, erasure in `weddy.test.ts`, maintenance access,
  `AcceptTermsSchema`). Verified in headless Chrome with mocked `/api` responses:
  legal pages without overflow at 360/1024 px, registration blocked without terms and sent
  with `acceptTerms: true`, account deletion calls `DELETE /api/auth/account` and shows the
  confirmation. The compiled API registers 20 functions (28 endpoints).
- Not done by the agent: `MAINTENANCE_TOKEN` in Azure and GitHub; manual deletion of Gmail copies.
- `CLAUDE.md`: rule 3 (cross-domain ports), rules 25–27 (policy, switch, erasers).
- Touched pages: `architecture/{personalData,domains,endpoints,frontend,dataCosmos}.md`,
  `domains/{identity,contact,portal,weddy,weddyWedding}.md`, `operations/deployment.md`,
  `overview.md`, `decisions.md` (5 decisions; open questions 13–14 closed, 15–16 added), `index.md`.

## [2026-09-15] ingest | Translations – Czech and English with vue-i18n

Source: [raw/2026-09-15-translations.md](../raw/2026-09-15-translations.md)

- Answers: cs + en; switcher with localStorage and browser default, no language in URLs;
  schemas, API messages and e-mails translated; legal documents Czech only.
- **Shared kernel:** `i18n.ts` (`LOCALES`, `resolveLocale`, `Catalog<T>`, `messageKeys`), cs/en
  catalogs next to the schemas in every subdomain file, aggregated in `messages.ts`
  (`shared.*`, `weddyShared.*`). Schemas use keys; `*_LABELS` maps replaced by
  `guestsKeys`/`planningKeys`; `AcceptTermsSchema` moved to `identity.ts`;
  `formatCurrency(amount, locale)`; the birth-year message no longer contains the current year.
- **API:** `DomainError` defaults, domain errors, `MessageResponse` and HTTP errors return keys;
  `requestLocale` from `Accept-Language`; `User.locale` stored at registration and by
  `startSession`/`resolveSession`; `emails.ts` rewritten with cs/en texts (scheduler e-mails by
  `User.locale`). New `test/i18n.test.ts`; tests 117 → 127.
- **Portal:** vue-i18n 11 (`src/i18n/index.ts`: detection, Czech plural rule, `setLocale`,
  `currentLocale`, `translateMessage`), catalogs `locales/{app,portal,identity,weddy,weddyGuests,weddyPlanning}.ts`,
  `LocaleSwitcher.vue` in the portal nav, mobile menu and IziWeddy headers, `callEndpoint` sends
  `Accept-Language`. All components converted (four parallel sub-agents by area); `content/site.ts`
  keeps only structural data. The legal page shows an English notice that the document is Czech only.
- Fixes found on the way: `StatusBadge` showed the guest label "Přijal" (Accepted) for approved planning
  items – new required `kind` prop; the planning intro said "Osm oblastí" (eight areas) although there
  are 11 – now `{n}` from `PLANNING_CATEGORIES`; Czech plurals corrected ("Před 1 dnem", "2 položky nemají").
- Privacy policy: account data now lists the UI language; section 3 mentions `localStorage.fc_locale`.
- Verified: typecheck, 127 tests, build; headless Chrome with mocked `/api` – 12 pages (portal,
  identity, IziWeddy, legal, 404) in cs and en at 360 and 1024 px, sign-in and registration also signed out:
  no untranslated Czech in English (except the intentional "IČO" gloss), no raw keys, no vue-i18n
  warnings, no horizontal overflow; switching sets `<html lang>`, localStorage and `Accept-Language: en`.
- `CLAUDE.md`: Language section, rules 12 and 15, new section *Translations (i18n)* (rules 28–32),
  code conventions and "What not to do".
- New page `architecture/i18n.md`; touched `architecture/{valibot,frontend,personalData}.md`,
  `domains/{identity,portal,weddy}.md`, `overview.md`, `decisions.md` (3 decisions, open question 3 answered), `index.md`.

## [2026-09-15] change | Deployment failure – Node 22 and diagnostics

Source: owner's report – the deploy step fails with `An unknown exception has occurred`.

- Finding: the GitHub Actions history shows **no successful deployment since at least 2026-09-11**;
  all runs past the checks fail inside `StaticSitesClient` at "Preparing deployment". The wiki claim
  that the SWA CLI works was never confirmed – corrected in `operations/deployment.md`.
- Known Azure platform regression with the same symptom (static-web-apps#1750, Microsoft Q&A, 2026-05/06).
- The app still requested `node:20`, retired by Azure Functions on 2026-04-30 → moved to **Node 22**:
  `staticwebapp.config.json` `apiRuntime`, workflow `setup-node` and `--api-version`, esbuild `target`,
  root `engines`.
- Workflow: step printing package contents, `--verbose=silly`, manual `without_api` input deploying only
  the website to preview environment `diagnostika` to separate an API problem from an Azure one.
- `build-deploy.mjs`: `npm install` runs through a shell on Windows (was `spawnSync npm ENOENT`).
- Verified locally: `npm run build:api` on Windows, `func start` on the bundle (Node 22) indexes all 20 functions.
  The deployment itself could not be tested locally (needs the deployment token).
- Touched pages: `operations/deployment.md`, `overview.md`, `decisions.md` (decision + open question 17), `index.md`.

## [2026-09-15] change | Deployment still failing after Node 22

- The run after the Node 22 change failed again, this time after receiving `DeploymentId: 8cba83a8-46df-4e39-9f12-ba310f96a289` –
  the client side (token, validation, runtime) passes and the Azure deployment backend fails, as in static-web-apps#1750.
- #1750 is still open without a Microsoft response; a commenter reproduced it on a brand-new SWA in another region.
- Next steps are on the owner's side (Azure portal): diagnostic run `without_api`, stuck environments, token regeneration,
  a test SWA, posting the deployment IDs to #1750. Recorded in `operations/deployment.md`.

## [2026-09-15] change | Deployment – website-only run also fails, newer deploy client

- Diagnostic run `without_api` failed identically (`DeploymentId: abefbcbc-809c-4eb8-a53d-27435af28c95`) –
  the API bundle is ruled out; the failure is in the Azure deployment backend or this Static Web App.
- The CLI uses StaticSitesClient `stable` from 2026-05-21, the time the regression started; a `latest` build from
  2026-08-05 exists. Workflow now sets `SWA_CLI_DEPLOY_BINARY_VERSION` (default `latest`, manual input `client_version`).
- If `latest` fails too, only Azure-side steps remain (see `operations/deployment.md`).
