# fridrich.cloud

Monorepozitář pro `fridrich.cloud` – prezentační portál a produkty pod ním.
Frontend je **jedna aplikace** na jedné doméně; produkty jsou podstromy rout
s vlastním vzhledem.

| Část | Adresa | Popis |
|---|---|---|
| **Portál** | `www.fridrich.cloud` | Libor Fridrich – vývoj na míru |
| **IziWeddy** | `www.fridrich.cloud/izi-weddy` | Svatební plánovač |
| **IziBudgy** | `www.fridrich.cloud/izi-budgy` | Rozpočet domácnosti *(TODO)* |
| **API** | `www.fridrich.cloud/api` | Sdílené backendové API |

## Dokumentace

Vše podstatné je v adresáři [`doc/`](doc/):

- [doc/README.md](doc/README.md) – rozcestník a rozdělení projektu
- [doc/architecture.md](doc/architecture.md) – struktura repozitáře, adresy, identita, nasazení
- [doc/portal.md](doc/portal.md) – portál a jeho design systém
- [doc/iziweddy.md](doc/iziweddy.md) – specifikace svatebního plánovače
- [doc/izibudgy.md](doc/izibudgy.md) – rozpočet domácnosti (zadání)

Pravidla pro psaní kódu jsou v [`CLAUDE.md`](CLAUDE.md).

## Technologie

Vue 3 + TypeScript + Vite · Azure Functions (Node.js) · Azure Cosmos DB · Azure Static Web Apps
