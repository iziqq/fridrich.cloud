---
title: Typy a validace – Valibot
type: koncept
sources:
  - raw/2026-09-15-domenova-architektura.md
  - kód: packages/shared/src/validation.ts, packages/weddy-shared/src
updated: 2026-09-15
---

# Typy a validace – Valibot

> Každý typ, který přechází po drátě nebo přichází od uživatele, vzniká
> z **Valibot schématu** a TypeScript typ se z něj odvozuje
> (`v.InferOutput` / `v.InferInput`). Ruční `interface` pro data API se
> nepíše. Stejné schéma validuje formulář, požadavek na backendu i odpověď
> na frontendu.

Knihovna: [`valibot`](https://valibot.dev) `^1.5`, import vždy jako
`import * as v from 'valibot'`. Je závislostí `packages/shared`,
`packages/weddy-shared`, `apps/api` i `apps/portal`.

## Kde schémata žijí

| Druh | Místo | Příklad |
|---|---|---|
| Stavební bloky polí (text, e-mail, URL, datum) a převod chyb | `packages/shared/src/validation.ts` | `requiredText`, `optionalText`, `emailText`, `optionalHttpUrl`, `optionalIsoDate`, `issuesToDetails` |
| Kontrakt chyb a obecné odpovědi | `packages/shared/src/api.ts` | `ApiErrorBodySchema`, `MessageResponseSchema` |
| Doména identity a kontaktu | `packages/shared/src/identity.ts`, `contact.ts` | `UserSchema`, `AccountEmailSchema`, `ContactMessageInputSchema` |
| Doména weddy – jeden soubor na subdoménu | `packages/weddy-shared/src/<subdoména>.ts` | `WeddingInputSchema`, `GuestSchema`, `PlanningItemInputSchema`, `BudgetSummarySchema` |
| Obálka konkrétního endpointu | soubor `*.endpoint.ts` | `ListGuestsResponse = v.object({ guests, stats })` |

## Pojmenování

- Schéma: `<Věc>Schema` ve sdíleném jádru, `<Jméno>Request|Response|Params|Query` v endpointu.
- Typ: bez přípony (`type Guest = v.InferOutput<typeof GuestSchema>`).
- Dvojice **entita × vstup**:
  - `GuestSchema` – jak záznam vypadá v odpovědi (bez transformací, jen tvar).
  - `GuestInputSchema` – co přichází z formuláře (pravidla, ořez, normalizace; bez `id`, časů a výchozích hodnot).
- Výčty: konstanta `as const` + `v.picklist` + popisky:
  `GUEST_STATUSES` → `GuestStatusSchema` → `type GuestStatus` → `GUEST_STATUS_LABELS`.
  Kontrola hodnoty neznámého původu: `v.is(PlanningCategorySchema, raw)`.

## Pravidla

1. **Hlášky jsou česky a pro uživatele** – předávají se každé akci
   (`v.nonEmpty('Vyplňte jméno')`). Formulář je zobrazuje u pole beze změny.
2. **Nepovinný text:** prázdný řetězec po ořezu je `undefined`
   (`optionalText`). Frontend tak může posílat hodnoty polí tak, jak jsou.
3. **Normalizace patří do schématu:** ořez mezer, e-mail malými písmeny,
   cena zaokrouhlená na koruny. Doména dostává už čistá data.
4. **Výchozí hodnoty nepatří do schématu,** ale do domény (`status ?? 'draft'`)
   – jsou to business rozhodnutí, ne tvar dat.
5. **Pravidla závislá na stavu** (přístup, jednorázovost, počet pokusů)
   do schématu nepatří – jsou v doméně. Schéma řeší jen to, co jde poznat
   z hodnoty samotné.
6. **Bezpečnostní výjimka:** kde doména musí vracet jednotnou chybu, je
   schéma endpointu schválně volné (`verifyLoginCode` bere jen dva řetězce),
   aby validace neprozradila víc než doména.
7. **Neznámé klíče se zahazují** (`v.object` je ve výstupu nepropouští) –
   do domény se nedostane nic, co schéma nezná.

## Chyby a cesty k polím

`issuesToDetails(issues)` převede issues na `[{ field, message }]`:

- `field` je tečková cesta (`groom.firstName`, `members.1.firstName`), prázdný
  řetězec pro chybu celého těla.
- Na jedno pole se bere **první** chyba.
- Úplně chybějící klíč Valibot hlásí za objekt s anglickou hláškou – převod ji
  nahradí `Vyplňte toto pole`.

Backend z toho staví `400 ValidationError`, frontend `ApiError` se stejnými
`details`; `ApiError.fieldErrors` je mapa `pole → hláška` pro formulář.

## Doména a schémata

- Doménové objekty přijímají **výstupní typy** schémat (`GuestInput`),
  nikoli `unknown` – parsování proběhlo v endpointu.
- Hodnotové objekty, které jsou invariantem samy o sobě (`EmailAddress`,
  jméno uživatele), validují znovu přes **totéž schéma** (`v.safeParse`) a při
  chybě vyhodí `DomainError.field(...)`. Platí to i pro volání mimo HTTP.

## Úskalí

- `v.record(picklist, …)` dělá klíče v typu nepovinné – pro rozpis „hodnota
  pro každou kategorii" se skládá `v.object` z výčtu (viz `BudgetSummarySchema`).
- `v.isoDate` nekontroluje existenci dne (`2026-02-31` projde) – používej `optionalIsoDate`.
- Rok narození kontroluje schéma proti aktuálnímu roku v době parsování.

## Související

- [Endpointy](endpointy.md)
- [Doménová architektura](domeny.md)
