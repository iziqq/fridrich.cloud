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

## [2026-09-15] change | Deployment root cause – newline in the deployment token

- With StaticSitesClient `latest` the log finally showed the exception: `System.FormatException: The format of value
  'token ***⏎' is invalid` in `ContentDistributionClient.InitializeClient` – the secret
  `AZURE_STATIC_WEB_APPS_API_TOKEN` ends with a newline, which makes the `Authorization` header invalid.
- The Azure regression hypothesis (#1750) is withdrawn for this project; Node 22 and the diagnostics stay.
- Workflow: new step **Deployment token** strips whitespace, masks the value, exports `SWA_CLI_DEPLOYMENT_TOKEN` and warns
  when something was stripped; deploy steps no longer read the raw secret.
- Touched pages: `operations/deployment.md` (root cause), `decisions.md` (decision, open question 17 updated).

## [2026-09-15] change | Address removed from the footer

- Owner's request: the footer bottom line shows only name and IČO (`portal.footer.identification`, cs + en).
  The registered address stays in the privacy policy and terms (`content/legal.ts`).
- Touched pages: `domains/portal.md`, `architecture/personalData.md`.

## [2026-09-15] ingest | Portal redesign – Glass (dark + orange) instead of cyberpunk

Source: [raw/2026-09-15-glassDesign.md](../raw/2026-09-15-glassDesign.md)

- `packages/design`: `theme-cyberpunk.css` removed, new `theme-glass.css` (semantic tokens, radii, blur, orange page glows),
  `effects.css` rewritten (`.glass`, `.accent-glow`, `.text-gradient`, `.reveal`, reduced motion/transparency and
  no-`backdrop-filter` fallbacks), fonts Rajdhani/Chakra Petch/JetBrains Mono replaced by Inter; `.mono` label restyled.
- Portal: `CyberButton` → `AppButton` (orange / glass pill), `GlitchHeading` → `SectionHeading`, new `SectionLabel`,
  glass pill navigation and blurred mobile menu, new hero; all `--cp-*` colours → `--color-*`, bevel/scanline/noise/glitch
  classes → `.glass`; uppercase headings and wide tracking removed; chips, status badges, step markers, inputs and
  the delete button rounded; sentence messages no longer use the uppercase label style.
- Texts: HUD prefixes removed from catalogs and templates (`// 01 — O MNĚ` → `O mně`, `> odesláno` → `Odesláno`),
  legal document labels too; `index.html` theme colour and favicon orange.
- API e-mail layout moved to the same palette (rounded card, orange pill button).
- Verified in headless Chrome: home sections at 1440 px, hero/process/login at 360 px, legal page, account with the
  delete confirmation – no horizontal overflow.
- Touched pages: `domains/portal.md` (binding rules, new *Design: Glass* section, accessibility), `architecture/monorepo.md`,
  `decisions.md`, `index.md`; raw source listed in `doc/raw/README.md`.

## [2026-09-15] change | Logo in the navigation, favicon, bar always visible

- Owner added `apps/portal/src/assets/logo.svg` (fox); `SiteNav` shows it instead of the "FL" monogram.
- The navigation no longer hides when scrolling down (scroll listener and `.is-hidden` removed).
- `apps/portal/public/favicon.svg` = logo on a dark rounded square (white eyes stay visible on light tabs);
  `index.html` links it instead of the inline data-URI icon.
- Verified in headless Chrome at 1024 and 360 px: after scrolling ~2 300 px the bar is still 16 px from the top,
  the logo loads, `/favicon.svg` is served as `image/svg+xml`.
- Touched pages: `domains/portal.md`.

## [2026-09-16] ingest | IziWeddy dashboard: welcome screen and single-plan summary

Source: [raw/2026-09-16-weddyDashboard.md](../raw/2026-09-16-weddyDashboard.md)

- Dashboard now has three shapes (details in [domains/weddyWedding.md](domains/weddyWedding.md#features)):
  welcome screen with four section tiles when there is no plan, a large summary
  with stats and quick links for exactly one plan, the grid of cards from two up.
- `WeddingSummary` gained `decidedSectionCount` (planning sections with at least
  one accepted item). New pure function `countDecidedSections` in
  `packages/weddy-shared/src/planning.ts`, filled in by `listWeddings`.
- New frontend files: `weddy/wedding/DashboardWelcome.vue`, `WeddingOverview.vue`,
  `weddingFormats.ts` (shared `formatDate` / `countdown`); `DashboardView.vue`
  only chooses between the three shapes. New keys `weddy.dashboard.welcome.*`,
  `stats.sections*`, `stats.*Hint`, `addAnother` in cs and en; `emptyTitle` and
  `emptyDescription` removed.
- Tests: 2 new (decided sections), 126 → 128 passing.
- Verified in headless Chrome at 360 / 768 / 1024 px in Czech and English on a
  temporary preview page (the dashboard is behind login), then removed. Two
  alignment bugs found and fixed: centred paragraphs were shifted left by the
  global `p { max-width: 70ch }` without `margin-inline: auto`.
- Touched pages: `domains/weddyWedding.md`, `decisions.md`, `index.md`;
  raw source listed in `doc/raw/README.md`.

## [2026-09-16] ingest | IziWeddy plan settings, roles and invitations

Source: [raw/2026-09-16-weddySettingsAndRoles.md](../raw/2026-09-16-weddySettingsAndRoles.md)

- New subdomain `weddy/access`: roles `admin` (creator), `manager`, `viewer`.
  `Wedding` keeps `members` + derived `memberIds`; `loadWeddingFor` takes the
  access level (`read` / `edit` / `settings`) and the aggregate decides
  (`assertCanRead/Edit/ManageSettings`). Documents with the old `ownerIds` are
  still read and rewritten on the next save.
- Invitations by e-mail: existing account is added right away, an unknown
  address gets a `WeddingInvitation` (new container `weddingInvitations`,
  PK `/weddingId`, TTL 30 days) that becomes membership on registration
  (`claimWeddingInvitations` via the new identity port `UserRegistrationListener`).
  `UserDataEraser` now receives `{ id, email }`; weddy reads accounts through
  the new `UserDirectory` port. `EmailSender` moved to `domain/shared/`, the
  e-mail layout to `application/shared/emailLayout.ts`.
- Endpoints 28 → 34: `updateWedding` split into `updateCouple` and
  `updateWeddingSettings`, plus five access endpoints. `getWedding`,
  `createWedding` and both updates answer with `WeddingDetail` (wedding + the
  caller's role); `WeddingSummary` carries the role too.
- Frontend: new `SettingsView.vue` (wedding, access, deletion) as the fifth tab
  for the admin, the Couple screen lost the title and date, a viewer sees a
  *read only* badge, disabled fields and no action controls. Fixed: the bottom
  bar used `repeat(var(--tab-count), …)`, which is invalid CSS – with five tabs
  it broke into two rows; it now uses `grid-auto-columns`.
- GDPR: privacy policy gained the row *Sdílení plánování v IziWeddy* and a
  paragraph about invitations; `PRIVACY_POLICY_VERSION` bumped to 2026-09-16.
- Tests 128 → 143 (new `apps/api/test/weddyAccess.test.ts`). Verified in
  headless Chrome at 360 and 1024 px in Czech and English on a temporary preview
  page with a stubbed API, then removed.
- New page `domains/weddyAccess.md`; touched `domains/weddyWedding.md`,
  `domains/weddy.md`, `architecture/domains.md`, `architecture/dataCosmos.md`,
  `architecture/personalData.md`, `domains/identity.md`, `overview.md`,
  `decisions.md` (5 decisions, open questions 15 and 16), `index.md`, `CLAUDE.md`.

## [2026-09-16] lint | Member vocabulary in the wedding aggregate

- Renamed after the roles landed, so the names match what the code does:
  `WeddingRepository.listForOwner` → `listForMember`, `Wedding.isOwnedOnlyBy` →
  `isOnlyMember`, `Wedding.removeOwner` → `leave`, `Wedding.create({ ownerId })`
  → `{ creatorId }`. The stored legacy field `ownerIds` keeps its name – it is
  data written by older versions.
- Wiki pages using the old names updated (`weddyAccess.md`, `weddyWedding.md`,
  `architecture/personalData.md`, `architecture/dataCosmos.md`). Older log
  entries keep the names that were true when they were written.

## [2026-09-16] change | Footer anchored to the bottom, short pages centred

Reported by the owner: on `/projekty/iziweddy` and `/projekty/izibudgy` the
footer sat in the middle of the window instead of at the bottom.

- Cause: `#app { height: 100dvh }` made the content area exactly one window tall,
  so the footer started right below it and the page scrolled even when the
  content was short. `SiteFooter` added another `--section-gap` on top of that.
- `#app` is now a flex column with `min-height: 100dvh`, `main` grows, and
  `#app > main > .page` fills the leftover space and centres its content with
  `padding-block: 6rem var(--space-8)`. `SiteFooter` lost its fixed top margin –
  the gap after a long page comes from the last section's own padding, which
  halves the pre-footer gap on the home page (~310 px → ~155 px).
- Applies to every short portal screen, because they all use `.page` as the root:
  project detail, sign-in, registration, e-mail verification, account, 404.
- Verified in headless Chrome: both project pages at 1280×900 and 360×740 fit the
  window with the whole footer visible, sign-in is centred, and the home page
  keeps its section spacing (checked with a temporarily shortened hero, reverted).
- Touched pages: `architecture/frontend.md` (new section *Page shell and short
  pages*), `index.md`.

## [2026-09-16] change | Settings reachable from the weddy dashboard

Owner's request: the dashboard should offer the plan settings too.

- `WeddingOverview.vue` (single plan): the quick links now include *Nastavení*
  for an admin – five links, the odd last one spans both columns on mobile and
  the row uses `grid-auto-columns` from tablet up.
- `DashboardView.vue` (two plans and more): the card is now the list item and
  carries a *Nastavení* link under the stats, shown only for plans the user
  administers. A link inside a link is not valid HTML, hence the restructure.
- Both reuse `weddy.layout.tabs.settings`, so no new translation keys.
- Verified in headless Chrome at 360 and 1024 px (one plan as admin and as
  viewer, two plans with mixed roles) on a temporary preview page, then removed.
- Touched page: `domains/weddyWedding.md`.

## [2026-09-16] change | Couple trimmed to first and last name

Owner's request: the app should not collect what it does not use.

- Removed from `PersonSchema` / `PersonInputSchema`, the Couple form and the
  stored document: `birthYear`, `email`, `phone`, `note`. Message keys
  `birthYearInvalid`, `phoneTooLong`, `noteTooLong` and the translations
  `weddy.weddingForm.{birthYear,email,phone,note}` went with them
  (`emailInvalid` stays – invitations use it).
- `Wedding.fromState` now reads only the two names, so a document written
  earlier loses the old fields the next time the wedding is saved. No migration
  script; nothing else reads them.
- Privacy policy row for IziWeddy shortened to "jméno a příjmení snoubenců";
  `PRIVACY_POLICY_VERSION` stays `2026-09-16` (today's version has not been
  deployed yet, so it is still the same unpublished revision).
- Tests 143 → 142: the birth-year and e-mail cases were replaced by one that
  asserts everything except the two names is dropped.
- Touched pages: `domains/weddyWedding.md`, `architecture/personalData.md`,
  `decisions.md`.

## [2026-09-16] change | Guests: filter popover, search on the right, sides side by side

Owner's request for a less crowded guests screen.

- `GuestsView.vue`: the four filter dropdowns moved into a popover under a
  *Filtry* button (left of the toolbar); the search field sits on the right.
  The button shows the number of active filters; the popover closes on Esc, on a
  click outside (`pointerdown` listener while open) and gives focus back.
- Groom and bride sections are a grid – two columns from `--tablet`, stacked on
  a phone (`.sides`).
- Search already matched family names; the behaviour is now documented and was
  verified (`novakovi` finds *Novákovi* and expands the family).
- New keys `weddy.guests.filters.button` and `buttonActive` (cs + en).
- Verified in headless Chrome at 360 px (list, open popover) and 1024 px (two
  columns, search by family) on a temporary preview page, then removed.
- Touched page: `domains/weddyGuests.md`.


## [2026-09-16] change | Weddy: buttons in sheets, the two guest actions, shared select style

Owner's request after the guests rework: *+ Rodina* had a different radius and
colour than *+ Host*, the buttons in the modal were unstyled and the dropdowns
looked cramped.

- `BottomSheet.vue`: the teleported root is `<div class="weddy overlay">`.
  `<Teleport to="body">` puts the overlay outside the `.weddy` subtree, so
  neither the tokens nor `.weddy .btn` reached it and the buttons inside sheets
  rendered as the browser's grey default.
- `GuestsView.vue`: *+ Rodina* is the same pill as *+ Host*, outlined in the
  accent colour instead of filled; *Uložit* (Save) and *Uložit rodinu* (Save
  family) are primary, *+ Další člen* (Add another member) secondary.
- `weddy.css`: one `.weddy select` / `.weddy option` rule for the whole product
  (touch height, room for the arrow, custom chevron as an inline SVG, hover and
  disabled state). The duplicated scoped blocks were deleted from `GuestsView.vue`
  and `SettingsView.vue`, which had already drifted apart.
- Verified in headless Chrome at 360, 768 and 1024 px (guest sheet, family sheet,
  open filter popover) on a temporary preview page, then removed.
- Touched pages: `architecture/frontend.md`, `domains/weddyGuests.md`.

## [2026-09-16] change | Weddy draws its own dropdowns and confirmation dialogs

Owner: the native `<select>` list looks like a default system roller, and a
delete should use our own modal.

- New `SelectField.vue` – a `button` + `ul[role=listbox]` with the theme's
  padding, hover, tick on the selected option and full keyboard handling
  (arrows, Home/End, Enter, Esc, click outside). Esc stops propagation so it
  does not close the filter popover underneath.
- New `ConfirmDialog.vue` + `askConfirm()` (`components/confirm.ts`), mounted
  once in `WeddyShell.vue`. Replaces `window.confirm` in all six places:
  guest, family, planning item, plan deletion, removing access, cancelling an
  invitation. Focus starts on *Zrušit* (Cancel), the confirming button is
  `btn-danger` and says what happens (*Smazat hosta* – Delete guest).
- The confirmation texts (cs + en) were reworded from "Really delete…?" to the
  consequence, because the question is now the dialog's title.
- `weddy.css`: the `.weddy select` / `option` rules added earlier the same day
  were removed – no `<select>` is left in the product.
- Both overlays (`ConfirmDialog`, `BottomSheet`) set `background: transparent`
  and dim the page with `rgb(43 36 48 / 0.22)`: the `weddy` class they need for
  the tokens also brings the theme's background, so the page behind them was
  covered instead of dimmed.
- Verified in headless Chrome at 360 and 1024 px (open dropdown in the filter
  popover, confirmation dialog, settings screen) on a temporary preview page,
  then removed.
- Touched pages: `domains/weddy.md`, `domains/weddyGuests.md`,
  `architecture/frontend.md`.

## [2026-09-16] ingest | Planning bundles: one offer, one price, several sections

Source: [raw/2026-09-16-planningBundles.md](../raw/2026-09-16-planningBundles.md)
– a venue offered the ceremony, the reception, food, drinks, flowers,
decorations and the band for a single price, and the planner had nowhere to put
that.

Decided with the owner:

- A **bundle** has a name, a link, one price and a status; items are added
  inside it, each keeping its own section. The alternative (a bundle as a set of
  ticked sections) was rejected – it cannot record *what* the music actually is.
- The example mentions music, which had no section. A twelfth section `music`
  (Hudba) was added between `decorations` and `suit`; the dashboard now counts
  "decided X of 12".

Implementation:

- Shared kernel: `PlanningBundleSchema`, `PlanningBundleInputSchema`,
  `PlanningItemSchema.bundleId`, `itemStatus`, `bundleCategories`;
  `countDecidedSections(items, bundles)`.
- Budget: `calculateBudget(items, bundles)` counts a bundle price once, ignores
  the price of items inside it (`bundleItems` per section instead) and returns
  `bundles[]` for the new block on the budget screen. The section breakdown
  deliberately does not add up to the total – one price cannot be split between
  sections without inventing numbers.
- API: `PlanningBundle` aggregate, `PlanningBundleRepository`, container
  `planningBundles` (PK `/weddingId`), five endpoints, cascade in
  `deleteWedding`. Deleting a bundle **keeps its items** and only frees them.
  An item may only join a bundle of the same wedding.
- Portal: `PlanningBundleView.vue`, `BundleSheet.vue`, a Balíčky block on the
  planning overview and on the budget screen, a bundle picker in the item form,
  *v balíčku X* instead of a price in the section detail.
- Tests: four new cases in `weddy.test.ts` (146 API tests pass).
- Verified in headless Chrome at 360, 390 and 1024 px on a temporary preview
  page, then removed.
- Touched pages: `domains/weddyPlanning.md`, `domains/weddyBudget.md`,
  `domains/weddy.md`, `raw/README.md`, index.

## [2026-09-16] change | Inside a bundle only the section is entered

Owner: when adding an item inside a bundle there is nothing to call it – the
name and the link belong to the offer. Only the section should be there.

- `PlanningItemSchema.name` is optional and `PlanningItemInputSchema` requires
  it only when the item has no `bundleId` (`v.forward(v.check(…), ['name'])`, so
  the error still lands on the field). New `itemTitle(item, bundles)` – a
  nameless item is shown under its bundle's name.
- Bundle detail: the form is a single section picker, offering only sections the
  bundle does not have yet; the list is one row per section (*Co je v ceně*), in
  enum order. An item moved in from a section keeps its name and link and both
  are shown under the section.
- Section detail: a bundle entry is titled with the bundle name and linked as
  *z balíčku* (from the bundle); the "Bez odkazu" (no link) note is not shown for
  it, because the link belongs to the offer.
- Tests: an item with no name outside a bundle fails on the `name` field; an
  entry inside a bundle needs none (148 API tests pass).
- Section icons moved from `PlanningView.vue` to `planning/categoryIcons.ts` and
  added to the list inside a bundle – the same section now looks the same in
  both places.
- Touched page: `domains/weddyPlanning.md`.

## [2026-09-17] ingest | IziBudgy – the first version

Source: [raw/2026-09-17-budgyStart.md](../raw/2026-09-17-budgyStart.md) – income
as several entries, expenses split into recurring and one-off, and a chart.

Decided with the owner: **months with history** (recurring entries carry over,
one-off ones have a date), **one account** for now (sharing can come later like
IziWeddy's) and a **fixed list of categories**.

- New workspace `packages/budgy-shared`: `BudgetEntrySchema`,
  `BudgetEntryInputSchema` (conditional rules as `v.forward(v.check(…))`, so the
  error lands on the field), `MonthSchema`, `appliesTo`, `summarizeMonth`,
  `monthlyTrend`. `formatCurrency` moved to `@fridrich/shared` – both products
  write amounts the same way.
- API: `BudgetEntry` aggregate, repository, container `budgetEntries`
  (PK `/userId`), four endpoints, `budgyDeps` and `eraseUserBudgyData` wired as
  a second `UserDataEraser`.
- Portal: `/izi-budgy` with its own theme (cool green, `tabular-nums`), the
  month screen with a summary, a hand-drawn SVG donut *Kam peníze jdou* (Where
  the money goes), a six-month trend that doubles as month navigation, and the
  entries in three sections. IziBudgy is now linked from the projects page.
- **Shared product UI kit**: `BottomSheet`, `ConfirmDialog`, `FormField`,
  `SelectField`, `ChoiceField`, `EmptyState`, `ErrorBlock`, `LoadingBlock` and
  `FabButton` moved from `weddy/components/` to `components/product/`, their
  styles to `styles/product.css` under the class `.product`. They had reached
  straight into weddy's rose palette, so the first budgy screens came out pink;
  they now use semantic tokens only (`--color-accent-strong`,
  `--color-accent-wash`, `--color-surface-alt`). Which product is on screen is
  held by `components/product/theme.ts` for the teleported overlays.
- GDPR: policy row *Aplikace IziBudgy*, the product named in the lead and in the
  terms, `PRIVACY_POLICY_VERSION` → `'2026-09-17'`; routes and endpoints are
  inside `PERSONAL_DATA_COLLECTION_ENABLED` from the first commit.
- Tests: 11 new cases (`budgy.test.ts`) – validity from the month of creation,
  an ended entry keeps history, a one-off counts only in its month, the summary,
  a stranger's entry, account deletion, the month shift and the trend. 159 API
  tests pass.
- Verified in headless Chrome at 360, 390, 768, 1024 and 1280 px (month,
  charts, form, empty state) on a temporary preview page, then removed.
- New pages: `domains/budgy.md`, `domains/budgyEntries.md`,
  `domains/budgyBudget.md`. Touched: `architecture/frontend.md`,
  `architecture/personalData.md`, `architecture/dataCosmos.md`, `overview.md`,
  `raw/README.md`, index.
