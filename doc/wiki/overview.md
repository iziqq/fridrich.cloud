---
title: Přehled projektu
type: prehled
sources:
  - historie: doc/README.md (commit 8db5e0a)
  - kód: celý repozitář
updated: 2026-09-15
---

# Přehled projektu fridrich.cloud

> Monorepo pro `www.fridrich.cloud`: prezentační portál Libora Fridricha
> (vývoj na míru) a produkty pod ním. **Jedna Vue aplikace** na jedné doméně,
> **jedno API** na Azure Functions rozdělené na domény, **Cosmos DB**.
> Nasazení na Azure Static Web Apps Free.

## Části

| Část | Adresa | Popis | Stav |
|---|---|---|---|
| **Portál** | `/` | Prezentace – o mně, služby, postup vývoje, projekty, kontakt | ✅ hotový |
| **Identita** | `/prihlaseni`, `/registrace`, `/ucet` | Bezheslový účet společný pro všechno | ✅ hotová |
| **IziWeddy** | `/izi-weddy` | Svatební plánovač – snoubenci, hosté, plánování, rozpočet | ✅ hotový |
| **IziBudgy** | `/izi-budgy` | Rozpočet domácnosti | 🕓 TODO – chybí specifikace |
| **API** | `/api` | `identity`, `contact`, `weddy` – 26 endpointů | ✅ hotové |

```
                    ┌──────────────────────────────────────┐
                    │  www.fridrich.cloud – jeden origin    │
                    └──────────────────┬───────────────────┘
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        ▼              ▼               ▼               ▼              ▼
       /            /prihlaseni    /izi-weddy      /izi-budgy       /api
    Portál          identita       IziWeddy        IziBudgy      identity · contact
                                                                  · weddy · (budgy)
```

## Technologie

Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Pinia, Vue Router ·
Azure Functions v4 (Node 20) · Azure Cosmos DB (NoSQL) · **Valibot** (typy
a validace) · Azure Static Web Apps · npm workspaces.

## Postup prací

1. ✅ Rozdělení projektu a dokumentace
2. ✅ Portál – kostra monorepa, `packages/design`, `apps/portal`
3. ✅ Backend – `identity`, `weddy`, kontaktní formulář
4. ✅ Přihlášení na portálu – bezheslová registrace a kód na e-mail
5. ✅ Frontend IziWeddy
6. ✅ Sloučení do jedné aplikace – produkty jako podstromy portálu
7. ✅ Nasazení – GitHub Actions + SWA CLI
8. ✅ Doménová architektura FE i BE, endpoint v souboru, Valibot, LLM Wiki (2026-09-15)
9. ⬜ IziBudgy – doplnit specifikaci, potom implementovat

## Kam dál

- Jak je kód poskládaný: [architektura/domeny.md](architektura/domeny.md)
- Jak přidat endpoint: [architektura/endpointy.md](architektura/endpointy.md)
- Katalog všech stránek: [index.md](index.md)
