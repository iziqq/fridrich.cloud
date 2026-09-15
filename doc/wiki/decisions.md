---
title: Rozhodnutí a otevřené otázky
type: rozhodnuti
sources:
  - raw/2026-09-15-domenova-architektura.md
  - raw/iziweddy-specifikace.md (kap. 12), raw/portal-specifikace.md (kap. 11)
  - historie: doc/architecture.md (Otevřené otázky, Zodpovězeno)
updated: 2026-09-15
---

# Rozhodnutí a otevřené otázky

> Rejstřík rozhodnutí, která tvarují kód, a otázek, na které se čeká.
> Nové rozhodnutí se připisuje **nahoru** s datem a odkazem na zdroj;
> překonané se neškrtá, jen se u něj uvede, co ho nahradilo.

## Rozhodnutí

| Datum | Rozhodnutí | Proč | Detail |
|---|---|---|---|
| 2026-09-15 | **Dokumentace jako LLM Wiki** (Karpathy): `doc/raw` neměnné zdroje, `doc/wiki` stránky udržované agentem, schéma v `CLAUDE.md` | Znalosti se skládají a udržují průběžně, místo aby se znovu dohledávaly v kódu a zastaralých dokumentech | [CLAUDE.md](../../CLAUDE.md), [index](index.md) |
| 2026-09-15 | **Doménové členění FE i BE** – `identity`, `contact`, `weddy/{wedding,guests,planning,budget}` | Stejná mapa domén v API i ve frontendu; změna subdomény je na jednom místě | [domeny.md](architektura/domeny.md) |
| 2026-09-15 | **Snoubenci jsou součástí `wedding`, ne subdoména `couple`** | Hodnotové objekty bez vlastního životního cyklu, jeden dokument, jeden formulář, jeden endpoint | [domeny.md](architektura/domeny.md#subdomény-weddy) |
| 2026-09-15 | **Jeden soubor na endpoint** na FE i BE (`<jméno>.endpoint.ts`), schémata requestu i response v něm | Vše k HTTP kontraktu na jednom místě; business logika zůstává v doméně | [endpointy.md](architektura/endpointy.md) |
| 2026-09-15 | **Schémata endpointu se píšou na FE i BE zvlášť, ze sdílených bloků** | Požadavek mít request/response v souboru endpointu; pravidla polí přesto existují jen jednou ve sdíleném jádru. Alternativa (kontrakt endpointu ve sdíleném balíčku) odmítnuta kvůli lokalitě. | [endpointy.md](architektura/endpointy.md#soulad-fe-a-be) |
| 2026-09-15 | **Všechny typy dat přes Valibot**, validace requestu na BE, requestu i response na FE | Jeden zdroj pravdy pro typ i validaci; rozjetý kontrakt se pozná za běhu | [valibot.md](architektura/valibot.md) |
| 2026-09-15 | **Rozpočet na obrazovce Rozpočet z endpointu `getBudget`**, přehled sekcí dál lokálně | Subdoména `budget` komunikuje se svým endpointem; přehled sekcí potřebuje okamžitý přepočet | [weddy-budget.md](domeny/weddy-budget.md) |
| 2026-09-15 | **Endpointy se registrují seskupené podle cesty** (`registerEndpoints`) | Azure Functions nedovolí dvě funkce na stejné cestě s různými metodami | [endpointy.md](architektura/endpointy.md) |
| dříve | **Vlastní modul `identity`**, ne Entra External ID | Cizí přihlašovací obrazovka by nešla sladit s vzhledem | [identity.md](domeny/identity.md) |
| dříve | **Bez hesel** – registrace jménem a e-mailem, přihlášení kódem | Heslo nic nepřidá, obnova stejně visí na e-mailu; odpadá celá bezpečnostní vrstva hesel | [identity.md](domeny/identity.md) |
| dříve | **Cesty pod `www.fridrich.cloud`, ne subdomény** | Jeden origin: bez CORS, bez cookie přes `Domain=.fridrich.cloud`, jeden certifikát | [monorepo.md](architektura/monorepo.md) |
| dříve | **Jedna frontendová aplikace**, produkty jako podstromy rout | Sdílí identitu, tokeny i typy; oddělené buildy znamenaly proxy, přepisy cest a víc nasazení | [frontend.md](architektura/frontend.md) |
| dříve | **API jako spravované funkce SWA Free**, ne samostatný Function App | Free tier; samostatný Function App vyžaduje Standard | [nasazeni.md](provoz/nasazeni.md) |
| dříve | **Nasazení přes SWA CLI**, ne GitHub akci | Akce neumí přeskočit build API a padala bez vysvětlení | [nasazeni.md](provoz/nasazeni.md) |
| dříve | **Vývoj i produkce na jedné databázi `izi-db`** | Strop 400 RU/s na účet – druhá databáze se nevejde | [data-cosmos.md](architektura/data-cosmos.md) |
| dříve | **Rodina nemá vlastní záznam** – skupina hostů se stejným `family.id` | Strana zůstává na hostovi, filtry a statistiky fungují beze změny | [weddy-guests.md](domeny/weddy-guests.md) |
| dříve | **Jména klientů na webu neuvádět**, jen odvětví | Smluvní omezení | [portal.md](domeny/portal.md) |
| dříve | Menu portálu: *O mně · Služby · Vývoj · Projekty · Kontakt · Přihlásit se*; reference zatím ne | *Vývoj* = postup spolupráce, *Projekty* = vlastní produkty | [portal.md](domeny/portal.md) |

## Otevřené otázky

| # | Oblast | Otázka | Návrh |
|---|---|---|---|
| 1 | platforma | Mají být produkty placené? | Zatím zdarma |
| 2 | platforma | Instalace na plochu (PWA)? | Ano u produktů (`vite-plugin-pwa`), u portálu ne |
| 3 | platforma | Vícejazyčnost? | Zatím čeština, texty držet mimo komponenty |
| 4 | platforma | Oddělit vývojovou a produkční databázi? | Až poroste provoz – zvýšit strop účtu, druhá databáze |
| 5 | weddy | Může plánování sdílet víc uživatelů (oba snoubenci)? | Doména to umí (`Wedding.shareWith`), chybí endpoint a pozvánky |
| 6 | weddy | Může být v jedné sekci schváleno víc položek? | Zatím povolit, případně upozornění |
| 7 | weddy | `updateGuest` na členovi rodiny přepíše stranu jen jemu (UI to nenabízí – členy upravuje formulář rodiny, API ano) | Zvážit, aby `Guest.update` u člena rodiny stranu ponechal |
| 8 | portál | Analytika? | Bez cookies – Application Insights nebo Plausible |
| 9 | portál | Blog / články? | Zatím ne |
| 10 | portál | Fotka na portrét a IČO do patičky | Dodá zadavatel |
| 11 | budgy | Otázky před specifikací | [budgy.md](domeny/budgy.md#otázky-před-specifikací) |

Zodpovězené a překonané (historie): e-maily – původní návrh Azure
Communication Services, v provozu je SMTP (ACS zůstává jako alternativa);
UI knihovna pro IziWeddy – vlastní CSS nad `@fridrich/design`, žádná knihovna.
