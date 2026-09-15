---
title: Data v Cosmos DB
type: koncept
sources:
  - kód: apps/api/src/config.ts, apps/api/src/infrastructure/cosmos
  - historie: doc/architecture.md kap. 7 (commit 8db5e0a)
updated: 2026-09-15
---

# Data v Cosmos DB

> Azure Cosmos DB (NoSQL API), účet `lf-page-db`, databáze **`izi-db`**.
> Kontejner na agregát, partition key podle dominantního dotazu, sdílená
> kapacita na úrovni databáze. Doména o Cosmos DB neví.

## Kontejnery

| Kontejner | Partition key | Doména | Poznámka |
|---|---|---|---|
| `users` | `/id` | identity | |
| `tokens` | `/userId` | identity | aktivační odkazy, TTL 30 dní |
| `loginCodes` | `/userId` | identity | přihlašovací kódy, TTL 1 hodina |
| `sessions` | `/userId` | identity | TTL 60 dní |
| `rateLimits` | `/id` | sdílené | TTL 24 hodin |
| `contactMessages` | `/id` | contact | |
| `weddings` | `/id` | weddy / wedding | včetně snoubenců a `ownerIds` |
| `guests` | `/weddingId` | weddy / guests | rodina je pole `family` u hosta |
| `planningItems` | `/weddingId` | weddy / planning | rozpočet se neukládá, počítá se |
| *(TODO)* | | budgy | |

Názvy drží `CONTAINERS` v `apps/api/src/config.ts`. Kontejnery i databáze
vznikají samy při prvním použití (`createIfNotExists`); dočasná data maže
Cosmos DB sám přes **TTL**, úklidová úloha není potřeba.

Partition key se volí podle dominantního dotazu – u hostů a položek je to vždy
„vše pro jednu svatbu", proto `/weddingId`.

## Kapacita (RU/s)

Účet **není serverless**, má předplacenou kapacitu se stropem **400 RU/s na
celý účet**:

1. **Kapacita se drží na databázi, ne na kontejnerech.** Kontejner s vlastní
   kapacitou chce minimálně 400 RU/s – devět kontejnerů by chtělo 3600
   a vytvoření by selhalo. Řídí to `COSMOS_THROUGHPUT` (na serverless účtu prázdné).
2. **Nová databáze se do stropu nevejde** – produkty proto sdílí `izi-db`.

> ⚠️ **Vývoj i produkce jedou proti stejné databázi.** Vědomé rozhodnutí.
> Při lokálním zkoušení s `local.settings.json` mířícím na `lf-page-db` se
> zapisuje do ostrých dat. Oddělení = zvýšit strop účtu a založit druhou databázi.

> ℹ️ V `izi-db` zůstávají kontejnery `Seats`, `Users` a `AuthSessions`
> z předchozí aplikace. Pozor na `Users` vs. `users` – Cosmos DB rozlišuje
> velikost písmen.

## Pravidla pro kód

- Repozitáře (`infrastructure/cosmos/*Repositories.ts`) přijímají a vracejí
  jen doménové objekty (`Guest.fromState(stripSystemFields(doc))`,
  `container.items.upsert(guest.toState())`).
- Typy SDK (`ItemResponse`, `FeedResponse`, …) mimo `infrastructure/cosmos` nesmí.
- Cosmos neumí transakce napříč kontejnery – pořadí zápisů volí use-case tak,
  aby šla operace po pádu zopakovat (svatba se maže poslední).

## Související

- [Backend](backend.md) · [Nasazení](../provoz/nasazeni.md) · [Lokální vývoj](../provoz/lokalni-vyvoj.md)
