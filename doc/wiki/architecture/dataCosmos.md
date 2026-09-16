---
title: Data in Cosmos DB
type: concept
sources:
  - code: apps/api/src/config.ts, apps/api/src/infrastructure/cosmos
  - history: doc/architecture.md ch. 7 (commit 8db5e0a)
updated: 2026-09-17
---

# Data in Cosmos DB

> Azure Cosmos DB (NoSQL API), account `lf-page-db`, database **`izi-db`**.
> One container per aggregate, partition key by the dominant query, capacity
> shared at database level. The domain knows nothing about Cosmos DB.

## Containers

| Container | Partition key | Domain | Note |
|---|---|---|---|
| `users` | `/id` | identity | `lastSeenAt`, `inactivityWarningSentAt` drive deletion of inactive accounts |
| `tokens` | `/userId` | identity | activation links, TTL 30 days |
| `loginCodes` | `/userId` | identity | login codes, TTL 1 hour |
| `sessions` | `/userId` | identity | TTL 60 days |
| `rateLimits` | `/id` | shared | TTL 24 hours; `id` is `action:fingerprint`, so no readable IP or e-mail is stored ([security.md](security.md)) |
| `contactMessages` | `/id` | contact | TTL 365 days (privacy policy) |
| `weddings` | `/id` | weddy / wedding | the couple and `members` (`userId`, `role`, `addedAt`) plus the derived `memberIds` |
| `weddingInvitations` | `/weddingId` | weddy / access | pending invitation by e-mail (the lookup runs on `emailHash`), TTL 30 days (`WEDDING_INVITATION_RETENTION_DAYS`) |
| `guests` | `/weddingId` | weddy / guests | a family is the `family` field on a guest |
| `planningItems` | `/weddingId` | weddy / planning | the budget is not stored, it is calculated |
| `planningBundles` | `/weddingId` | weddy / planning | one offer for one price; the item holds the `bundleId`, the bundle holds no list |
| `budgetEntries` | `/userId` | budgy / entries | income and expenses of one account; the month is not a record, it is derived from the range or the date |

Names are held by `CONTAINERS` in `apps/api/src/config.ts`. Containers and the
database are created on first use (`createIfNotExists`); temporary data is
deleted by Cosmos DB itself via **TTL**, no cleanup job is needed.
Because `createIfNotExists` never changes an existing container, `initDatabase`
**reconciles `defaultTtl`** when it differs from the definition (`container.replace`) –
otherwise a TTL added later (contact messages) would never apply in production.

The partition key follows the dominant query – for guests, items and
invitations it is always "everything for one wedding", hence `/weddingId`.
Looking an invitation up by e-mail (`listForEmail`) is therefore a
cross-partition query, but it runs rarely: when an invitation is issued (to
refuse a duplicate), when someone registers and when an account is deleted. The
frequent read is the access screen of one plan, and that one stays inside a
single partition.

**`memberIds` on a wedding is a derived field**, kept in sync by the aggregate
from `members`. It exists purely so that `listForMember` can ask
`ARRAY_CONTAINS(c.memberIds, @ownerId)` – a plain array of ids is served by the
default index, while the same test over the array of member objects would need a
partial-object match. Documents created before roles have only `ownerIds`; the
query matches both and `Wedding.fromState` converts them (first owner →
`admin`, the rest → `manager`), so a document is rewritten in the new shape on
its next save – no migration script.

## Capacity (RU/s)

The account is **not serverless**; it has provisioned capacity capped at
**400 RU/s for the whole account**:

1. **Capacity is held by the database, not by containers.** A container with its
   own capacity needs at least 400 RU/s – ten containers would need 4000 and
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
