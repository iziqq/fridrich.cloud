# fridrich.cloud – dokumentace

Rozcestník dokumentace celého projektu. Projekt není jedna aplikace, ale **portál
a několik samostatných produktů** pod jednou střechou – a od nynějška i pod
**jednou doménou**: `www.fridrich.cloud`. Části se rozlišují cestou, ne subdoménou.

## Rozdělení projektu

| Část | Adresa | Popis | Stav |
|---|---|---|---|
| **Portál** | `www.fridrich.cloud` | Komerční / prezentační web – Libor Fridrich, vývoj na míru | ✅ Hotový |
| **IziWeddy** | `www.fridrich.cloud/izi-weddy` | Svatební plánovač – hosté, přípravy, rozpočet | ✅ Hotový |
| **IziBudgy** | `www.fridrich.cloud/izi-budgy` | Rozpočet domácnosti | 🕓 TODO – chybí specifikace |
| **API** | `www.fridrich.cloud/api` | Sdílené backendové API (identita + weddy + kontakt) | ✅ Hotové |

```
                    ┌──────────────────────────────────────┐
                    │        www.fridrich.cloud            │
                    │        jedna doména, jeden origin    │
                    └──────────────────┬───────────────────┘
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        │              │               │               │              │
        ▼              ▼               ▼               ▼              ▼
       /            /prihlaseni    /izi-weddy      /izi-budgy       /api
    Portál          /registrace    Svatební        Rozpočet      Identita
  (prezentace)       (identita)    plánovač       domácnosti     + moduly
                                        │               │              ▲
                                        └───────────────┴──────────────┘
                                              volání na stejný origin
```

Každá část se pořád **buildí a nasazuje zvlášť** – společná je jen adresa,
díky které odpadá CORS i cookie přes subdomény.

## Dokumenty

| Dokument | Obsah |
|---|---|
| [architecture.md](architecture.md) | Rozdělení repozitáře, adresy, sdílené balíčky, identita, nasazení |
| [portal.md](portal.md) | Portál `www.fridrich.cloud` – obsah, navigace, cyberpunkový design systém |
| [iziweddy.md](iziweddy.md) | Svatební plánovač – kompletní funkční specifikace |
| [izibudgy.md](izibudgy.md) | Rozpočet domácnosti – zatím jen zadání k rozpracování |

Pravidla pro psaní kódu (domain-first backend, konvence, testování) jsou
v [`CLAUDE.md`](../CLAUDE.md) v kořeni repozitáře.

## Postup prací

1. ✅ **Rozdělení projektu** – tato dokumentace.
2. ✅ **Portál** – kostra monorepa, `packages/design` a `apps/portal`.
3. ✅ **Backend** – `apps/api`: moduly `identity`, `weddy` a kontaktní formulář,
   24 endpointů, 63 testů nad paměťovými repozitáři.
4. ✅ **Přihlášení na portálu** – bezheslová registrace a přihlášení kódem na e-mail.
5. ✅ **Frontend IziWeddy** – `apps/iziweddy` podle [iziweddy.md](iziweddy.md).
6. 🔄 **Přechod na jednu doménu** – produkty pod cestami místo subdomén.
   IziWeddy už jede na `/izi-weddy`; zbývá IziBudgy (až vznikne) a workflow nasazení.
7. ⬜ **Nasazení** – Static Web Apps, Function App, GitHub Actions.
8. ⬜ **IziBudgy** – doplnit specifikaci, potom implementovat.
