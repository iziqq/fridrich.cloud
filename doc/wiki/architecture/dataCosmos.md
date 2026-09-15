---
title: Data in Cosmos DB
type: concept
sources:
  - code: apps/api/src/config.ts, apps/api/src/infrastructure/cosmos
  - history: doc/architecture.md ch. 7 (commit 8db5e0a)
updated: 2026-09-15
---

# Data in Cosmos DB

> Azure Cosmos DB (NoSQL API), account `lf-page-db`, database **`izi-db`**.
> One container per aggregate, partition key by the dominant query, capacity
> shared at database level. The domain knows nothing about Cosmos DB.

## Containers

| Container | Partition key | Domain | Note |
|---|---|---|---|
| `users` | `/id` | identity | |
| `tokens` | `/userId` | identity | activation links, TTL 30 days |
| `loginCodes` | `/userId` | identity | login codes, TTL 1 hour |
| `sessions` | `/userId` | identity | TTL 60 days |
| `rateLimits` | `/id` | shared | TTL 24 hours |
| `contactMessages` | `/id` | contact | |
| `weddings` | `/id` | weddy / wedding | including the couple and `ownerIds` |
| `guests` | `/weddingId` | weddy / guests | a family is the `family` field on a guest |
| `planningItems` | `/weddingId` | weddy / planning | the budget is not stored, it is calculated |
| *(TODO)* | | budgy | |

Names are held by `CONTAINERS` in `apps/api/src/config.ts`. Containers and the
database are created on first use (`createIfNotExists`); temporary data is
deleted by Cosmos DB itself via **TTL**, no cleanup job is needed.

The partition key follows the dominant query – for guests and items it is
always "everything for one wedding", hence `/weddingId`.

## Capacity (RU/s)

The account is **not serverless**; it has provisioned capacity capped at
**400 RU/s for the whole account**:

1. **Capacity is held by the database, not by containers.** A container with its
   own capacity needs at least 400 RU/s – nine containers would need 3600 and
   creation would fail. Controlled by `COSMOS_THROUGHPUT` (empty on a serverless account).
2. **A new database does not fit under the cap** – products therefore share `izi-db`.

> ⚠️ **Development and production use the same database.** A deliberate
> decision. Local experiments with a `local.settings.json` pointing to
> `lf-page-db` write into live data. Separating them = raising the account cap
> and creating a second database.

> ℹ️ `izi-db` still contains the `Seats`, `Users` and `AuthSessions` containers
> from a previous application. Watch out for `Users` vs. `users` – Cosmos DB is
> case-sensitive.

## Rules for code

- Repositories (`infrastructure/cosmos/*Repositories.ts`) accept and return only
  domain objects (`Guest.fromState(stripSystemFields(doc))`,
  `container.items.upsert(guest.toState())`).
- SDK types (`ItemResponse`, `FeedResponse`, …) must not leave `infrastructure/cosmos`.
- Cosmos has no transactions across containers – the use case orders writes so
  that the operation can be repeated after a crash (the wedding is deleted last).

## Related

- [Backend](backend.md) · [Deployment](../operations/deployment.md) · [Local development](../operations/localDevelopment.md)
