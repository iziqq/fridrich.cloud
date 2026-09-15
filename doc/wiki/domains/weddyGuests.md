---
title: weddy / guests – hosté a rodiny
type: domena
sources:
  - raw/iziweddy-specifikace.md (kap. 4.2, 5.3, 7.2, 8)
  - kód: packages/weddy-shared/src/guests.ts, apps/api/src/domain/weddy/guests, apps/portal/src/weddy/guests
updated: 2026-09-15
---

# `weddy / guests` – hosté a rodiny

> Seznam hostů jedné svatby se stavem pozvánky. Hosty jde zadávat jednotlivě
> i **celou rodinu najednou**. Rodina nemá vlastní záznam – je to skupina hostů
> se stejným `family.id`.

## Výčty

| Výčet | Hodnoty (popisek) |
|---|---|
| `GuestSide` | `groom` (Ženich), `bride` (Nevěsta) |
| `AgeGroup` | `adult` (Dospělý), `child` (Dítě) |
| `GuestStatus` | `draft` (Návrh), `requested` (Pozván), `accepted` (Přijal), `rejected` (Odmítl) |

Běžný tok `draft → requested → accepted / rejected`, ale **přechody se
nevynucují** – uživatel musí jít opravit chybu.

## Host

| Pole | Pravidlo | Výchozí (doména) |
|---|---|---|
| `firstName` | povinné, 1–100 | |
| `lastName` | nepovinné, max. 100 (u členů rodiny se nevyplňuje) | |
| `side` | povinné | u člena rodiny ho určuje rodina |
| `ageGroup` | nepovinné v requestu | `adult` |
| `status` | nepovinné v requestu | `draft` |
| `family` | `{ id, name }` – nastavuje jen use-case rodin | |
| `note` | nepovinné, max. 2000 | |

## Rodina

Zadání: název, strana pro celou rodinu, seznam členů (jméno, věková skupina).

- **Strana patří rodině** – `Guest.joinFamily` ji přepíše všem členům, takže
  se strana rodiny nemůže rozejít s členy a statistiky sedí.
- **Seznam členů je při úpravě úplný:** člen s `id` se upraví, bez `id`
  vznikne, kdo chybí, přestává být hostem (`rewriteFamily` v
  `domain/weddy/guests/Family.ts`).
- Stav pozvánky má **každý člen zvlášť**.
- Smazání rodiny smaže všechny členy. Rodina bez členů neprojde schématem
  (1–30 členů, název 1–100).
- Úprava hosta přes běžný formulář ho **z rodiny nevyřadí**.
- Cena modelu: přejmenování nebo přesun rodiny přepíše všechny členy.

## Seznam na obrazovce

- Filtry: strana, věková skupina, stav; vyhledávání podle jména i názvu rodiny
  (bez ohledu na diakritiku). Filtruje se na klientu.
- Řazení podle příjmení (výchozí) nebo jména; není to filtr, „Zrušit filtry"
  ho nechá. Při shodě rozhoduje druhé jméno, porovnává se česky (`Čermák` za `Cach`).
- Jméno se vypisuje v pořadí řazení (`Novák Petr`).
- Strana je **sekce** (Ženich / Nevěsta), ne štítek. V sekci nejdřív rodiny jako
  bloky, pod nimi jednotlivci.
- Rodiny jsou **sbalené** se souhrnem (`4 členové · 2 děti`); při hledání nebo
  filtru se rozbalí všechny.
- Rychlá změna stavu klikem na štítek (optimisticky, při chybě se vrátí).
- Na úzkém displeji karty, na širším hutnější řádky.

## Statistiky (`calculateGuestStats`)

| Statistika | Výpočet |
|---|---|
| `total` | všichni kromě `rejected` |
| `accepted`, `requested`, `draft`, `rejected` | počty podle stavu |
| `groom`, `bride`, `adults`, `children` | rozdělení bez odmítnutých |

Počítají se vždy ze **všech** hostů – filtr mění jen seznam.

## Endpointy

| Endpoint | Metoda a cesta | Request → Response |
|---|---|---|
| `listGuests` | `GET …/weddings/{weddingId}/guests` | query `side?`, `ageGroup?`, `status?` → `{ guests: Guest[], stats: GuestStats }` |
| `createGuest` | `POST …/guests` | `GuestInput` → `201 Guest` |
| `updateGuest` | `PUT …/guests/{guestId}` | `GuestInput` → `Guest` |
| `changeGuestStatus` | `PATCH …/guests/{guestId}/status` | `{ status }` → `Guest` |
| `deleteGuest` | `DELETE …/guests/{guestId}` | → `204` |
| `createFamily` | `POST …/families` | `FamilyInput` → `201 Family` |
| `updateFamily` | `PUT …/families/{familyId}` | `FamilyInput` (členové s `id`) → `Family` |
| `deleteFamily` | `DELETE …/families/{familyId}` | → `204` |

Prefix `…` = `/api/weddy/weddings/{weddingId}`. Čtecí endpoint pro rodiny
neexistuje – skládají se ze seznamu přes `groupIntoFamilies()`.

```jsonc
// POST /api/weddy/weddings/{weddingId}/families
{
  "name": "Novákovi",
  "side": "groom",
  "members": [
    { "firstName": "Josef", "ageGroup": "adult" },
    { "firstName": "Themos", "ageGroup": "child" }
  ]
}
```

## Kód

| Vrstva | Soubor |
|---|---|
| Sdílené jádro | `packages/weddy-shared/src/guests.ts` – výčty, `GuestSchema`, `GuestInputSchema`, `FamilyInputSchema`, `FamilySchema`, `GuestStatsSchema`, `calculateGuestStats`, `groupIntoFamilies`, `guestFullName` |
| Doména | `apps/api/src/domain/weddy/guests/Guest.ts`, `Family.ts`, `GuestRepository.ts` |
| Use-casy | `apps/api/src/application/weddy/guests.ts` (hosté i rodiny) |
| Endpointy | `apps/api/src/endpoints/weddy/guests/`, `apps/portal/src/weddy/guests/endpoints/` |
| Store | `guests.store.ts` – `filters`, `sort`, `filtered`, `sections`, `stats`, `create`, `update`, `setStatus`, `remove`, `addFamily`, `editFamily`, `removeFamily` |
| UI | `GuestsView.vue` |
| Úložiště | kontejner `guests`, PK `/weddingId` |

## Související

- [weddy](weddy.md) · [wedding](weddy-wedding.md)
