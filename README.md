# fridrich.cloud

Monorepo for `fridrich.cloud` – a presentation portal and the products under it.
The frontend is **one application** on one domain; products are route subtrees
with their own look. Both backend and frontend are organised by domain.

| Part | Address | Description |
|---|---|---|
| **Portal** | `www.fridrich.cloud` | Libor Fridrich – custom software development |
| **IziWeddy** | `www.fridrich.cloud/izi-weddy` | Wedding planner |
| **IziBudgy** | `www.fridrich.cloud/izi-budgy` | Household budget *(TODO)* |
| **API** | `www.fridrich.cloud/api` | Shared backend API |

## Documentation

The documentation is an **LLM Wiki** style knowledge base in [`doc/`](doc/README.md):

- [doc/wiki/index.md](doc/wiki/index.md) – catalog of all pages (start here)
- [doc/wiki/overview.md](doc/wiki/overview.md) – project overview and status
- [doc/wiki/architecture/domains.md](doc/wiki/architecture/domains.md) – domain architecture on FE and BE
- [doc/wiki/architecture/endpoints.md](doc/wiki/architecture/endpoints.md) – one file per endpoint
- [doc/wiki/architecture/valibot.md](doc/wiki/architecture/valibot.md) – types and validation
- [doc/raw/](doc/raw/README.md) – original briefs and specifications

Rules for writing code and maintaining the wiki are in [`CLAUDE.md`](CLAUDE.md).

## Quick start

```bash
npm install          # dependencies + build of the shared packages
npm run dev:api      # Azure Functions on :7071
npm run dev:portal   # Vite on :5173 (proxy /api → :7071)
```

Details in [doc/wiki/operations/localDevelopment.md](doc/wiki/operations/localDevelopment.md).

## Technology

Vue 3 + TypeScript + Vite · Azure Functions (Node.js) · Azure Cosmos DB · Valibot · Azure Static Web Apps
