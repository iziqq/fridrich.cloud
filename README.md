# fridrich.cloud

Monorepozitář pro `fridrich.cloud` – prezentační portál a produkty pod ním.

| Část | Doména | Popis |
|---|---|---|
| **Portál** | `www.fridrich.cloud` | Libor Fridrich – vývoj na míru |
| **IziWeddy** | `iziweddy.fridrich.cloud` | Svatební plánovač |
| **IziBudgy** | `izibudgy.fridrich.cloud` | Rozpočet domácnosti *(TODO)* |
| **API** | `api.fridrich.cloud` | Sdílené backendové API |

## Dokumentace

Vše podstatné je v adresáři [`doc/`](doc/):

- [doc/README.md](doc/README.md) – rozcestník a rozdělení projektu
- [doc/architecture.md](doc/architecture.md) – struktura repozitáře, domény, identita, nasazení
- [doc/portal.md](doc/portal.md) – portál a jeho design systém
- [doc/iziweddy.md](doc/iziweddy.md) – specifikace svatebního plánovače
- [doc/izibudgy.md](doc/izibudgy.md) – rozpočet domácnosti (zadání)

Pravidla pro psaní kódu jsou v [`CLAUDE.md`](CLAUDE.md).

## Technologie

Vue 3 + TypeScript + Vite · Azure Functions (Node.js) · Azure Cosmos DB · Azure Static Web Apps
