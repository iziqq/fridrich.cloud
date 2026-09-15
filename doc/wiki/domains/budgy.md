---
title: Doména budgy – IziBudgy (TODO)
type: domena
sources:
  - raw/izibudgy-zadani.md
updated: 2026-09-15
---

# Doména `budgy` – IziBudgy, rozpočet domácnosti

> **Stav: TODO.** Jen hrubé zadání. Specifikace se dopíše, až zadavatel
> odpoví na otázky níže; implementace pak půjde stejným vzorem jako
> [weddy](weddy.md).

| | |
|---|---|
| **Adresa** | `www.fridrich.cloud/izi-budgy` |
| **API** | `/api/budgy/*` |
| **Frontend** | `apps/portal/src/budgy/<subdoména>/` |
| **Sdílené jádro** | `packages/budgy-shared` (vznikne) |
| **Identita** | společný účet – [identity.md](identity.md) |

## Předpokládané jádro (nepotvrzené)

Kandidáti na subdomény: **domácnost** (sdílená více uživateli), **účty**
(běžný, spořicí, hotovost), **kategorie**, **transakce** (příjem/výdaj),
**pravidelné platby**, **měsíční rozpočet** (plán vs. skutečnost),
**přehledy**.

## Otázky před specifikací

| # | Otázka |
|---|---|
| 1 | Ruční zadávání, nebo import bankovního výpisu (CSV / API banky)? |
| 2 | Sdílí rozpočet víc lidí, nebo je jednouživatelský? |
| 3 | Jen CZK, nebo víc měn? |
| 4 | Úvěry a splátky, nebo jen příjmy a výdaje? |
| 5 | Spořicí cíle („na dovolenou 60 000 Kč")? |
| 6 | Jak daleko do minulosti počítat historii a přehledy? |

## Až se začne

1. Odpovědi → nový zdroj v `doc/raw/` → ingest do této stránky a stránek subdomén.
2. `packages/budgy-shared` se schématy podle [valibot.md](../architektura/valibot.md).
3. Doména, use-casy a endpointy podle [endpointy.md](../architektura/endpointy.md).
4. Kontejnery do sdílené databáze `izi-db` (limit 25 kontejnerů) – [data-cosmos.md](../architektura/data-cosmos.md).
