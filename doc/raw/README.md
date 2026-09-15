# raw/ – immutable sources

The **sources** layer of the LLM Wiki: briefs, specifications and decisions as
the project owner supplied them. The agent reads them but **never edits their
content** – not even to fix an outdated fact or a broken link. Current, compiled
knowledge lives in the [wiki/](../wiki/index.md); when they disagree, the wiki
wins and the discrepancy is recorded in [wiki/log.md](../wiki/log.md).

All sources are stored **in English**. Input the owner gives in Czech is saved
as a faithful English translation (see [CLAUDE.md](../../CLAUDE.md#knowledge-base-llm-wiki)).

A new source = a new file with a camelCase name (`YYYY-MM-DD-shortName.md` for
dated briefs, e.g. `2026-09-15-domainArchitecture.md`) and an **ingest** operation.

| Source | Content | Compiled into |
|---|---|---|
| [iziweddySpec.md](iziweddySpec.md) | Original wedding planner specification. Chapters 3, 7 and 9–11 still describe a standalone repository and are superseded. | [domains/weddy*.md](../wiki/domains/weddy.md) |
| [portalSpec.md](portalSpec.md) | Portal specification – content, navigation, cyberpunk design system. | [domains/portal.md](../wiki/domains/portal.md) |
| [izibudgyBrief.md](izibudgyBrief.md) | Rough brief of the household budget app and questions before the spec. | [domains/budgy.md](../wiki/domains/budgy.md) |
| [2026-09-15-domainArchitecture.md](2026-09-15-domainArchitecture.md) | Request for domain architecture on FE and BE, one file per endpoint, Valibot, LLM Wiki. | [architecture/](../wiki/architecture/domains.md) |
| [2026-09-15-docsInEnglish.md](2026-09-15-docsInEnglish.md) | All documentation in English, including anything given in Czech. | [CLAUDE.md](../../CLAUDE.md), whole wiki |
| [2026-09-15-camelCaseFileNames.md](2026-09-15-camelCaseFileNames.md) | Documentation file names in camelCase, recorded in the docs. | [CLAUDE.md](../../CLAUDE.md#page-conventions), [decisions.md](../wiki/decisions.md) |
| [2026-09-15-gdprNoDataCollection.md](2026-09-15-gdprNoDataCollection.md) | Hide everything that collects personal data until GDPR documentation exists. | [architecture/personalData.md](../wiki/architecture/personalData.md), [decisions.md](../wiki/decisions.md) |
| [2026-09-15-legalDocumentsAndRetention.md](2026-09-15-legalDocumentsAndRetention.md) | Privacy policy and terms, self-service account deletion, one-year retention scheduler; controller identification from ARES. | [architecture/personalData.md](../wiki/architecture/personalData.md), [domains/identity.md](../wiki/domains/identity.md) |
| [2026-09-15-translations.md](2026-09-15-translations.md) | Translations with i18n – all labels in catalogs, Czech + English, switcher, keys from schemas and API, e-mails per user language; legal documents Czech only. | [architecture/i18n.md](../wiki/architecture/i18n.md), [CLAUDE.md](../../CLAUDE.md#translations-i18n) |
| [2026-09-15-glassDesign.md](2026-09-15-glassDesign.md) | Replace the cyberpunk look with a glass design similar to Apple's, dark and orange. Supersedes the design-system chapter of `portalSpec.md`. | [domains/portal.md](../wiki/domains/portal.md#design-glass) |
| [2026-09-15-responsiveFrontend.md](2026-09-15-responsiveFrontend.md) | Everything on the frontend responsive, breakpoints for notebook, tablet and mobile. | [CLAUDE.md](../../CLAUDE.md#frontend), [architecture/frontend.md](../wiki/architecture/frontend.md#responsive-layout-and-breakpoints) |

> ℹ️ Links inside the sources point to documents as they existed when the
> source was written (e.g. `architecture.md`, `iziweddy.md`). Those files no
> longer exist – their content has been compiled into the wiki, and the
> original text is in git history (commit `8db5e0a`).
>
> The three specifications were translated from Czech on 2026-09-15. Literal
> Czech UI texts (labels, buttons) are kept in Czech with an English gloss,
> because they are product content.
