# fridrich.cloud – dokumentace

Rozcestník dokumentace celého projektu. Projekt není jedna aplikace, ale **portál
a několik samostatných produktů** pod jednou střechou.

## Rozdělení projektu

| Část | Doména | Popis | Stav |
|---|---|---|---|
| **Portál** | `www.fridrich.cloud` | Komerční / prezentační web – Libor Fridrich, vývoj na míru | ✅ Hotový |
| **IziWeddy** | `iziweddy.fridrich.cloud` | Svatební plánovač – hosté, přípravy, rozpočet | 🔨 Backend hotový, frontend chybí |
| **IziBudgy** | `izibudgy.fridrich.cloud` | Rozpočet domácnosti | 🕓 TODO – chybí specifikace |
| **API** | `api.fridrich.cloud` | Sdílené backendové API (identita + weddy + kontakt) | ✅ Hotové |

```
                         ┌──────────────────────────────┐
                         │   www.fridrich.cloud         │
                         │   Portál (prezentace)        │
                         │   O mně · Služby · Reference │
                         │   Projekty · Kontakt         │
                         └───────────┬──────────────────┘
                                     │ přihlášení / registrace
                                     ▼
                         ┌──────────────────────────────┐
                         │   api.fridrich.cloud         │
                         │   Identita + moduly          │
                         └───────┬──────────────┬───────┘
                                 │              │
                 ┌───────────────▼───┐      ┌───▼──────────────────┐
                 │ iziweddy.…        │      │ izibudgy.…           │
                 │ Svatební plánovač │      │ Rozpočet domácnosti  │
                 └───────────────────┘      └──────────────────────┘
```

## Dokumenty

| Dokument | Obsah |
|---|---|
| [architecture.md](architecture.md) | Rozdělení repozitáře, domény, sdílené balíčky, identita, nasazení |
| [portal.md](portal.md) | Portál `www.fridrich.cloud` – obsah, navigace, cyberpunkový design systém |
| [iziweddy.md](iziweddy.md) | Svatební plánovač – kompletní funkční specifikace |
| [izibudgy.md](izibudgy.md) | Rozpočet domácnosti – zatím jen zadání k rozpracování |

Pravidla pro psaní kódu (domain-first backend, konvence, testování) jsou
v [`CLAUDE.md`](../CLAUDE.md) v kořeni repozitáře.

## Postup prací

1. ✅ **Rozdělení projektu** – tato dokumentace.
2. ✅ **Portál** – kostra monorepa, `packages/design` a `apps/portal`.
3. ✅ **Backend** – `apps/api`: moduly `identity`, `weddy` a kontaktní formulář,
   24 endpointů, 51 testů nad paměťovými repozitáři.
4. ⬜ **Frontend IziWeddy** – `apps/iziweddy` podle [iziweddy.md](iziweddy.md).
5. ⬜ **Přihlášení na portálu** – napojit `/prihlaseni` a `/registrace` na API.
6. ⬜ **Nasazení** – Static Web Apps, Function App, Cosmos DB, GitHub Actions.
7. ⬜ **IziBudgy** – doplnit specifikaci, potom implementovat.
