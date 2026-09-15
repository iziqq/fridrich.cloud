# Log wiki

Chronologický záznam operací nad znalostní bází – **jen se připisuje na konec**,
starší záznamy se nemění. Formát nadpisu je pevný, aby šel filtrovat:

```
## [RRRR-MM-DD] <ingest|query|lint|change> | <krátký název>
```

Posledních pět záznamů: `grep "^## \[" doc/wiki/log.md | tail -5`

---

## [2026-09-15] ingest | Založení wiki z dosavadní dokumentace

- Zavedena struktura LLM Wiki: `doc/raw/` (zdroje), `doc/wiki/` (stránky,
  `index.md`, `log.md`), schéma v `CLAUDE.md`.
- Do `raw/` přesunuty beze změny: `iziweddy.md` → `iziweddy-specifikace.md`,
  `portal.md` → `portal-specifikace.md`, `izibudgy.md` → `izibudgy-zadani.md`.
- `doc/architecture.md` a `doc/README.md` rozpuštěny do stránek
  `architektura/*`, `domeny/identity.md`, `provoz/*`, `prehled.md`,
  `rozhodnuti.md` a smazány (původní text: commit `8db5e0a`).
- Opravené rozpory proti kódu: sekcí plánování je 11, ne 8; e-maily jdou přes
  SMTP (ACS je alternativa); session platí 30 dní; kapitoly iziweddy o
  samostatném repozitáři označeny jako překonané.

## [2026-09-15] ingest | Doménová architektura, endpointy a Valibot

Zdroj: [raw/2026-09-15-domenova-architektura.md](../raw/2026-09-15-domenova-architektura.md)

Rozhodnutí (detail v [rozhodnuti.md](rozhodnuti.md)):
- Doménové členění FE i BE: `identity`, `contact`, `weddy/{wedding,guests,planning,budget}`.
  Zadání zmiňovalo doménu *Couple* – snoubenci zůstali v `wedding`
  (hodnotové objekty agregátu), zdůvodnění v [architektura/domeny.md](architektura/domeny.md).
- Jeden soubor `<jméno>.endpoint.ts` na endpoint na FE i BE.
- Všechny typy dat z Valibot schémat; validace na BE (params/query/body)
  i na FE (request před odesláním, response po přijetí).

Změny v kódu:
- `packages/shared`, `packages/weddy-shared` přepsány na Valibot, jeden soubor
  na subdoménu (`wedding.ts`, `guests.ts`, `planning.ts`, `budget.ts`).
- API: `http/endpoint.ts` (`defineEndpoint`, `registerEndpoints`), 26 souborů
  v `src/endpoints/`, doména rozdělená do `domain/weddy/{wedding,guests,planning}`,
  pravidla rodin přesunuta z use-casu do `domain/weddy/guests/Family.ts`,
  use-casy přijímají typovaný vstup místo `raw: unknown`. Smazány
  `functions/*.ts` a `http/handler.ts`.
- Portál: `api/http.ts` (`callEndpoint`), doménové složky `identity/`,
  `contact/`, `weddy/{wedding,guests,planning,budget}/` s `endpoints/`
  a `*.store.ts`. Smazán `weddy/api.ts`. `BudgetView` čte `getBudget`.
- Testy: 78 → 97 (nové `schemas.test.ts`, `endpoint.test.ts`).

Nové stránky: `architektura/domeny.md`, `architektura/endpointy.md`,
`architektura/valibot.md`, `architektura/backend.md`, `architektura/frontend.md`
a všechny `domeny/*`.
