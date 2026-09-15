# Index wiki

Katalog všech stránek znalostní báze. **Agent čte tenhle soubor jako první**,
vybere relevantní stránky a teprve pak sahá do kódu. Při každém ingestu nebo
nové stránce se index aktualizuje (pravidla v [CLAUDE.md](../../CLAUDE.md#knowledge-base-llm-wiki)).

Zdroje: [../raw/](../raw/README.md) · Chronologie změn: [log.md](log.md)

## Přehled

| Stránka | Shrnutí | Aktualizováno |
|---|---|---|
| [prehled.md](prehled.md) | Co je fridrich.cloud, části, stav, technologie, postup prací | 2026-09-15 |
| [rozhodnuti.md](rozhodnuti.md) | Rejstřík rozhodnutí s důvody a otevřené otázky | 2026-09-15 |

## Architektura (koncepty)

| Stránka | Shrnutí | Aktualizováno |
|---|---|---|
| [architektura/domeny.md](architektura/domeny.md) | Mapa domén a subdomén, kde doména žije na FE/BE, kam patří logika, pravidla závislostí | 2026-09-15 |
| [architektura/endpointy.md](architektura/endpointy.md) | Jeden soubor na endpoint: pojmenování, `defineEndpoint` (BE), `callEndpoint` (FE), postup přidání endpointu | 2026-09-15 |
| [architektura/valibot.md](architektura/valibot.md) | Typy a validace přes Valibot: kde schémata žijí, pojmenování, pravidla, chyby polí, úskalí | 2026-09-15 |
| [architektura/backend.md](architektura/backend.md) | `apps/api`: struktura, životní cyklus požadavku, pravidla vrstev, testy, CORS | 2026-09-15 |
| [architektura/frontend.md](architektura/frontend.md) | `apps/portal`: doménové složky, store vs. view, routing a vzhled produktů, adresy | 2026-09-15 |
| [architektura/monorepo.md](architektura/monorepo.md) | Principy rozdělení, struktura repa, sdílené balíčky, co kam patří, skripty | 2026-09-15 |
| [architektura/data-cosmos.md](architektura/data-cosmos.md) | Cosmos DB: kontejnery, partition keys, TTL, kapacita RU/s, pravidla repozitářů | 2026-09-15 |

## Domény

| Stránka | Shrnutí | Aktualizováno |
|---|---|---|
| [domeny/identity.md](domeny/identity.md) | Bezheslová identita: toky, doménový model, 6 endpointů, bezpečnostní pravidla | 2026-09-15 |
| [domeny/contact.md](domeny/contact.md) | Kontaktní formulář: pravidla, honeypot, rate limit, endpoint | 2026-09-15 |
| [domeny/weddy.md](domeny/weddy.md) | IziWeddy: subdomény, přístup přes `loadWeddingFor`, routy, zásady mobilního UI | 2026-09-15 |
| [domeny/weddy-wedding.md](domeny/weddy-wedding.md) | Plánování a snoubenci: dashboard, pravidla polí, 5 endpointů, kód | 2026-09-15 |
| [domeny/weddy-guests.md](domeny/weddy-guests.md) | Hosté a rodiny: výčty, pravidla rodin, seznam, statistiky, 8 endpointů | 2026-09-15 |
| [domeny/weddy-planning.md](domeny/weddy-planning.md) | 11 sekcí, položky, ceny, 5 endpointů | 2026-09-15 |
| [domeny/weddy-budget.md](domeny/weddy-budget.md) | Rozpočet z položek: výpočet, kde se počítá, endpoint `getBudget` | 2026-09-15 |
| [domeny/budgy.md](domeny/budgy.md) | IziBudgy (TODO): hrubé jádro a otázky před specifikací | 2026-09-15 |
| [domeny/portal.md](domeny/portal.md) | Portál: obsah, závazná pravidla (klienti, barvy, typografie), tokeny, přístupnost | 2026-09-15 |

## Provoz

| Stránka | Shrnutí | Aktualizováno |
|---|---|---|
| [provoz/lokalni-vyvoj.md](provoz/lokalni-vyvoj.md) | Spuštění, emulátor Cosmos DB, e-maily do konzole, rate limit při vývoji | 2026-09-15 |
| [provoz/nasazeni.md](provoz/nasazeni.md) | Azure SWA Free, pipeline, bundle API, Application settings | 2026-09-15 |
