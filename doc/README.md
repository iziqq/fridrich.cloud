# fridrich.cloud – dokumentace

Rozcestník dokumentace celého projektu. Frontend je **jedna Vue aplikace** na
doméně `www.fridrich.cloud`: portál v kořeni, produkty jako podstromy rout
s vlastním vzhledem. Backend je jedno API rozdělené na moduly.

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

Portál i produkty jsou **jeden build a jedno nasazení**. Jeden origin navíc
znamená, že odpadá CORS i cookie přes subdomény.

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
5. ✅ **Frontend IziWeddy** – `apps/portal/src/weddy` podle [iziweddy.md](iziweddy.md).
6. ✅ **Sloučení do jedné aplikace** – produkty jsou podstromy portálu pod
   cestami `/izi-weddy` a `/izi-budgy`, ne samostatné weby.
7. 🔄 **Nasazení** – repozitář je připravený (`build:site`, `build:api`,
   workflow pro GitHub Actions). Zbývá založit zdroje v Azure a vložit
   deployment token.
8. ⬜ **IziBudgy** – doplnit specifikaci, potom implementovat.
