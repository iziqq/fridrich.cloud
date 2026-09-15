---
title: Zadání – doménová architektura, endpointy a Valibot
type: zdroj
date: 2026-09-15
autor: Libor Fridrich
---

# Zadání – doménová architektura, endpointy a Valibot

Doslovné znění požadavku zadavatele. Neměnný zdroj – co z něj plyne, je
rozepsané ve wiki (viz [wiki/log.md](../wiki/log.md), záznam z 2026-09-15).

---

Rád bych abys přidal další dokumentaci pro AI agenta. Rád bych aby backend (API) i frontend bylo psána jako doménově. Např.:
- Weddy bude jedna velká doména
  - Budget bude doména, která bude komunikovat s API endpointy.
  - Couple doména
  - Guests doména
atd.

Dále Frontend komunikace s API:
Každý endpoint bude mít separátní soubor, např. getCouple.endpoint. V tomto souboru bude definovaný response type, request type.

Rád bych aby podobným stylem bylo řešeno i na backendu. Všechno co souvisí s endpointem, bylo u endpointu. Business logika vždy v doméně.

Všechny typy by měly být řešeny skrze Valibot package. Skrze to budeme řešit i validaci.

Udělej tyto informace podle LLM Wiki koncept Andreje Karpathyho !

Cokoliv bude potřeba změnit, tak změň
