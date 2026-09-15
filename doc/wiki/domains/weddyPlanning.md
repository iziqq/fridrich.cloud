---
title: weddy / planning – sekce a položky
type: domena
sources:
  - raw/iziweddy-specifikace.md (kap. 4.2, 5.4, 7.3, 8)
  - kód: packages/weddy-shared/src/planning.ts, apps/api/src/domain/weddy/planning, apps/portal/src/weddy/planning
updated: 2026-09-15
---

# `weddy / planning` – sekce přípravy a položky

> Jedenáct pevných sekcí přípravy. V každé libovolný počet **položek** –
> variant od dodavatelů, mezi kterými se rozhoduje. Položka může mít odkaz
> a cenu a je buď návrh, nebo schválená.

## Sekce (`PlanningCategory`, pořadí = `PLANNING_CATEGORIES`)

| # | Hodnota | Popisek |
|---|---|---|
| 1 | `ceremonyVenue` | Místo obřadu |
| 2 | `receptionVenue` | Místo veselky |
| 3 | `food` | Jídlo |
| 4 | `drinks` | Pití |
| 5 | `flowers` | Květiny |
| 6 | `decorations` | Výzdoba |
| 7 | `suit` | Oblek |
| 8 | `dress` | Šaty |
| 9 | `rings` | Prstýnky |
| 10 | `bachelorParty` | Rozlučka |
| 11 | `otherActivities` | Další aktivity |

Pořadí je tematické, ne abecední: jídlo a pití za místem veselky, prstýnky
za oblekem a šaty. Ikony sekcí jsou v `PlanningView.vue` (typované výčtem,
nová sekce bez ikony neprojde typecheckem).

> ⚠️ Původní specifikace uváděla 8 sekcí; platí 11 (přidané `food`, `drinks`, `rings`).

## Položka

| Pole | Pravidlo | Výchozí (doména) |
|---|---|---|
| `category` | jedna z 11 sekcí | |
| `name` | povinné, 1–200 | |
| `url` | nepovinné, jen `http://` / `https://`, max. 2000; otevírá se v nové záložce | |
| `price` | nepovinné, číslo 0 – 100 000 000 Kč, **zaokrouhlí se na koruny** | |
| `status` | `draft` (Návrh) / `accepted` (Schváleno) | `draft` |

- Cena je nepovinná schválně – dokud dodavatel nepošle nabídku, položka je
  bez ceny a rozpočet ji vede jako „bez ceny".
- V jedné sekci může být schválených víc položek (otevřená otázka, zatím povoleno).

## Funkce

- Přehled sekcí: u každé počet položek, počet schválených a součet cen
  (počítá `planning.store` přes `calculateBudget`, bez volání API).
- Detail sekce: přidání, úprava, smazání položky, přepnutí stavu klikem
  (optimisticky).

## Endpointy

| Endpoint | Metoda a cesta | Request → Response |
|---|---|---|
| `listPlanningItems` | `GET …/items` | query `category?` → `PlanningItem[]` |
| `createPlanningItem` | `POST …/items` | `PlanningItemInput` → `201 PlanningItem` |
| `updatePlanningItem` | `PUT …/items/{itemId}` | `PlanningItemInput` → `PlanningItem` |
| `changePlanningItemStatus` | `PATCH …/items/{itemId}/status` | `{ status }` → `PlanningItem` |
| `deletePlanningItem` | `DELETE …/items/{itemId}` | → `204` |

Prefix `…` = `/api/weddy/weddings/{weddingId}`.

## Kód

| Vrstva | Soubor |
|---|---|
| Sdílené jádro | `packages/weddy-shared/src/planning.ts` – výčty a popisky, `PlanningItemSchema`, `PlanningItemInputSchema` |
| Doména | `apps/api/src/domain/weddy/planning/PlanningItem.ts`, `PlanningItemRepository.ts` |
| Use-casy | `apps/api/src/application/weddy/planning.ts` |
| Endpointy | `apps/api/src/endpoints/weddy/planning/`, `apps/portal/src/weddy/planning/endpoints/` |
| Store | `planning.store.ts` – `items`, `budget` (součty sekcí), `overview`, `byCategory`, `load`, `create`, `update`, `setStatus`, `remove` |
| UI | `PlanningView.vue`, `PlanningCategoryView.vue` |
| Úložiště | kontejner `planningItems`, PK `/weddingId` |

## Související

- [weddy](weddy.md) · [budget](weddy-budget.md)
