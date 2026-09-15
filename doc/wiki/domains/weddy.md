---
title: Doména weddy – IziWeddy
type: domena
sources:
  - raw/iziweddy-specifikace.md (kap. 1, 4, 5, 6, 12)
  - raw/2026-09-15-domenova-architektura.md
  - kód: apps/api/src/*/weddy, apps/portal/src/weddy, packages/weddy-shared
updated: 2026-09-15
---

# Doména `weddy` – IziWeddy, svatební plánovač

> Mobilní webová aplikace pro plánování svatby: snoubenci, hosté (i celé
> rodiny), sekce přípravy s položkami od dodavatelů a automaticky počítaný
> rozpočet. Běží pod portálem na `www.fridrich.cloud/izi-weddy` se společným
> účtem fridrich.cloud.

| | |
|---|---|
| **Adresa** | `/izi-weddy` (konstanta `WEDDY_BASE`) |
| **API** | `/api/weddy/*` |
| **Frontend** | `apps/portal/src/weddy` |
| **Sdílené jádro** | `packages/weddy-shared` |
| **Měna** | CZK |
| **Platforma** | mobile-first, funkční i na desktopu |
| **Stav** | ✅ hotovo |

## Subdomény

| Subdoména | Obsah | Stránka |
|---|---|---|
| `wedding` | Plánování jako celek: název, datum, snoubenci, vlastníci, přístup; dashboard | [weddy-wedding.md](weddy-wedding.md) |
| `guests` | Hosté, rodiny, filtry, řazení, statistiky | [weddy-guests.md](weddy-guests.md) |
| `planning` | 11 sekcí přípravy a položky v nich | [weddy-planning.md](weddy-planning.md) |
| `budget` | Rozpočet ze všech položek | [weddy-budget.md](weddy-budget.md) |

```mermaid
erDiagram
    WEDDING ||--|| PERSON : "ženich"
    WEDDING ||--|| PERSON : "nevěsta"
    WEDDING ||--o{ GUEST : "hosté"
    WEDDING ||--o{ PLANNING_ITEM : "položky"
    GUEST }o--o| FAMILY : "rodina (bez vlastního záznamu)"
```

**Přístup:** každá svatba má `ownerIds`. Všechny use-casy všech subdomén
začínají `loadWeddingFor(deps, weddingId, userId)` – neexistující svatba
`404`, cizí `403`. Endpoint kontrolu nepíše.

## Routy

Relativně k `/izi-weddy`; odkazy skládá `weddyPath()`.

| Routa | Obrazovka | Subdoména |
|---|---|---|
| `/` | Dashboard | wedding |
| `/weddings/new` | Nové plánování | wedding |
| `/weddings/:weddingId` | → přesměrování na `couple` | wedding |
| `/weddings/:weddingId/couple` | Snoubenci | wedding |
| `/weddings/:weddingId/guests` | Hosté | guests |
| `/weddings/:weddingId/planning` | Přehled sekcí | planning |
| `/weddings/:weddingId/planning/:category` | Detail sekce | planning |
| `/weddings/:weddingId/budget` | Rozpočet | budget |

Detail svatby (`WeddingLayout`) má horní lištu s názvem a **spodní navigaci**
se čtyřmi záložkami: 💑 Snoubenci · 👥 Hosté · 📋 Plánování · 💰 Rozpočet.

## Zásady UI (mobile-first)

- Návrh od šířky **360 px**, desktop přes media queries.
- Dotykové prvky min. **44 × 44 px**.
- Primární akce jako **plovoucí tlačítko (FAB)** vpravo dole.
- Formuláře jako **bottom sheet** (`BottomSheet.vue`) nebo celá obrazovka.
- Stav vždy **barvou i textem** (`StatusBadge.vue`).
- Číselná pole `inputmode="numeric"`.
- Vzhled produktu jen pod třídou `.weddy` – viz [frontend.md](../architektura/frontend.md#routing-a-vzhled-produktu).

## Otevřené otázky a rozšíření

Otevřené otázky jsou v [rozhodnuti.md](../rozhodnuti.md#otevřené-otázky).
Možná rozšíření ze zadání: cílový rozpočet, zálohy a platby, checklist úkolů
s termíny, zasedací pořádek, dietní omezení, export CSV, připomínky hostům,
tmavý režim.

## Související

- [Doménová architektura](../architektura/domeny.md)
- Zdroj: [raw/iziweddy-specifikace.md](../../raw/iziweddy-specifikace.md)
