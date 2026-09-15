---
title: weddy / budget – rozpočet
type: domena
sources:
  - raw/iziweddy-specifikace.md (kap. 5.5, 7.4)
  - kód: packages/weddy-shared/src/budget.ts, apps/api/src/application/weddy/budget.ts, apps/portal/src/weddy/budget
updated: 2026-09-15
---

# `weddy / budget` – rozpočet

> Rozpočet **sečte ceny všech položek plánování**. Nikam se neukládá, vždy se
> počítá z aktuálních položek. Nemá vlastní agregát ani kontejner – je to
> odvozený pohled nad subdoménou `planning`.

## Hodnoty

| Hodnota | Výpočet |
|---|---|
| `total` | součet cen všech položek |
| `accepted` | součet cen položek `accepted` |
| `draft` | součet cen položek `draft` |
| `itemsWithoutPrice` | počet položek bez ceny – upozornění, že součet nemusí být úplný |
| `byCategory[sekce]` | totéž pro každou z 11 sekcí (klíč je vždy přítomen, i s nulami) |

Položky bez ceny se do součtů nepočítají (jako 0), jen do `itemsWithoutPrice`.

## Kde se počítá

Jediná implementace je `calculateBudget(items)` ve sdíleném jádru:

- **Backend** – endpoint `getBudget` (use-case `application/weddy/budget.ts`)
  načte položky a zavolá ji.
- **Frontend – obrazovka Rozpočet** (`BudgetView.vue`) volá endpoint
  `getBudget` při každém otevření; stav nesdílí, proto nemá store.
- **Frontend – přehled sekcí** v plánování počítá součty lokálně stejnou funkcí
  z položek v `planning.store`, aby se po úpravě přepočítal okamžitě.

Protože je výpočet jeden, čísla na obou místech nemůžou nesouhlasit.

## Obrazovka

Celkem velkým písmem, pruh schváleno/návrhy, rozpis podle sekcí (jen sekce
s cenou nebo s položkou bez ceny, odkaz do sekce), upozornění na položky bez
ceny, prázdný stav s odkazem na plánování.

## Endpoint

| Endpoint | Metoda a cesta | Response |
|---|---|---|
| `getBudget` | `GET /api/weddy/weddings/{weddingId}/budget` | `BudgetSummary` |

```json
{
  "total": 185000, "accepted": 120000, "draft": 65000, "itemsWithoutPrice": 2,
  "byCategory": {
    "ceremonyVenue": { "total": 45000, "accepted": 45000, "draft": 0, "itemsWithoutPrice": 0 },
    "flowers": { "total": 15000, "accepted": 0, "draft": 15000, "itemsWithoutPrice": 1 }
  }
}
```
*(ukázka zkrácená – `byCategory` obsahuje všech 11 sekcí)*

## Kód

| Vrstva | Soubor |
|---|---|
| Sdílené jádro | `packages/weddy-shared/src/budget.ts` – `BudgetBreakdownSchema`, `BudgetSummarySchema`, `calculateBudget`, `formatCurrency` |
| Use-case | `apps/api/src/application/weddy/budget.ts` |
| Endpointy | `apps/api/src/endpoints/weddy/budget/getBudget.endpoint.ts`, `apps/portal/src/weddy/budget/endpoints/getBudget.endpoint.ts` |
| UI | `apps/portal/src/weddy/budget/BudgetView.vue` |

## Související

- [planning](weddy-planning.md) · [weddy](weddy.md)
- Možné rozšíření: cílový rozpočet (kolik zbývá), zálohy a platby.
