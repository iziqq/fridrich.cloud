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
