---
title: weddy / wedding – plánování a snoubenci
type: domena
sources:
  - raw/iziweddy-specifikace.md (kap. 4, 5.1, 5.2, 8)
  - kód: packages/weddy-shared/src/wedding.ts, apps/api/src/domain/weddy/wedding, apps/portal/src/weddy/wedding
updated: 2026-09-15
---

# `weddy / wedding` – plánování a snoubenci

> Kořen domény weddy. Agregát `Wedding` drží název, datum, **ženicha
> a nevěstu** (hodnotové objekty `Person`) a seznam vlastníků. Ostatní
> subdomény se na něj odkazují přes `weddingId` a ověřují přes něj přístup.

## Funkce

**Dashboard** (čistě přehled): karty všech plánování uživatele – název
a jména snoubenců, datum a počet dní do svatby, hosté celkem / přijalo,
celkový rozpočet. Tlačítko „Přidat plánování", klik na kartu → detail.

**Snoubenci:** jeden formulář – blok Svatba (název, datum) a bloky Ženich
a Nevěsta se stejnými poli. Založení nového plánování používá tentýž formulář
(`WeddingForm.vue`).

## Pravidla

| Pole | Pravidlo | Schéma |
|---|---|---|
| `title` | povinné, 1–200 znaků | `WeddingInputSchema` |
| `weddingDate` | nepovinné, `YYYY-MM-DD`, den musí existovat | `optionalIsoDate` |
| `groom`, `bride` | povinné objekty | `PersonInputSchema` |
| `firstName`, `lastName` | povinné, 1–100 znaků | |
| `birthYear` | nepovinné, celé číslo 1900 – aktuální rok | |
| `email` | nepovinné, platný e-mail, lowercase | |
| `phone` | nepovinné, max. 40 znaků | |
| `note` | nepovinné, max. 2000 znaků | |

Doména:

- Zakladatel je jediný vlastník (`ownerIds = [userId]`); `shareWith` přidá dalšího
  (zatím bez endpointu).
- `toPublic()` odpověď **nikdy nenese `ownerIds`**.
- Smazání svatby smaže hosty i položky; svatba se maže **poslední** (Cosmos
  nezná transakce – pád uprostřed jde zopakovat).
- `daysUntilWedding` = celé dny do data (záporné po svatbě), počítá se z `Clock`.

## Endpointy

| Endpoint | Metoda a cesta | Request → Response |
|---|---|---|
| `listWeddings` | `GET /api/weddy/weddings` | → `WeddingSummary[]` (Wedding + `guestCount`, `acceptedGuestCount`, `budgetTotal`, `daysUntilWedding?`) |
| `createWedding` | `POST /api/weddy/weddings` | `WeddingInput` → `201 Wedding` |
| `getWedding` | `GET /api/weddy/weddings/{weddingId}` | → `Wedding` |
| `updateWedding` | `PUT /api/weddy/weddings/{weddingId}` | `WeddingInput` → `Wedding` |
| `deleteWedding` | `DELETE /api/weddy/weddings/{weddingId}` | → `204` |

## Kód

| Vrstva | Soubor |
|---|---|
| Sdílené jádro | `packages/weddy-shared/src/wedding.ts` – `PersonSchema`, `PersonInputSchema`, `WeddingSchema`, `WeddingInputSchema`, `WeddingSummarySchema`, `daysUntil` |
| Doména | `apps/api/src/domain/weddy/wedding/Wedding.ts`, `WeddingRepository.ts` |
| Use-casy | `apps/api/src/application/weddy/wedding.ts` – `loadWeddingFor`, `listWeddings`, `getWedding`, `createWedding`, `updateWedding`, `deleteWedding` |
| Endpointy BE | `apps/api/src/endpoints/weddy/wedding/` |
| Endpointy FE | `apps/portal/src/weddy/wedding/endpoints/` |
| Store | `wedding.store.ts` – `summaries`, `current`, `loadList`, `loadOne`, `create`, `update`, `remove` |
| UI | `DashboardView`, `WeddingNewView`, `CoupleView`, `WeddingForm`, `WeddingLayout` (načítá `current` pro hlavičku) |
| Úložiště | kontejner `weddings`, PK `/id` |

## Související

- [weddy](weddy.md) · [guests](weddy-guests.md) · [planning](weddy-planning.md) · [budget](weddy-budget.md)
- Proč není samostatná subdoména `couple`: [domeny.md](../architektura/domeny.md#subdomény-weddy)
