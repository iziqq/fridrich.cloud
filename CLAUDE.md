# CLAUDE.md

This file provides context and rules for Claude Code when working in this repository.

## Project overview

The application consists of two parts:

- **Frontend** – Vue 3 (Composition API, TypeScript, Vite)
- **Backend** – Node.js on Azure Functions (HTTP triggers), TypeScript
- **Database** – Azure Cosmos DB (NoSQL API)

The backend is designed **domain-first** – domain objects (entities, value objects, domain services) are the primary carriers of logic. Azure Functions handlers and Cosmos DB repositories are thin adapters around the domain, not the other way around.

## Backend architecture

```
src/
  domain/
    <aggregate>/
      <Aggregate>.ts          # domain object (entity) with behavior, not just a DTO
      <Aggregate>Repository.ts # interface (port), no dependency on the Cosmos SDK
      events.ts                # domain events, if relevant
  application/
    <useCase>.ts               # orchestration over domain objects, transaction boundary
  infrastructure/
    cosmos/
      CosmosClient.ts
      <Aggregate>CosmosRepository.ts  # repository implementation on top of Cosmos DB
  functions/
    <httpTriggerName>/
      index.ts                 # Azure Function – just parses the request, calls the use case, maps the response
      function.json
```

### Rules

1. **Domain objects are the center, not DTOs.** Entities carry validation and behavior (methods like `invoice.markAsPaid()`), not just flat data structures with logic living externally.
2. **The Azure Function handler is thin.** It parses the request → calls the use case/domain method → maps the result to an HTTP response. No business logic directly in `functions/*/index.ts`.
3. **Cosmos DB is an infrastructure detail.** The domain has no knowledge of the Cosmos SDK, partition key strategy, or SDK types (`ItemResponse`, `FeedResponse`, etc.). All of that stays in `infrastructure/cosmos`, hidden behind a repository interface defined in `domain/`.
4. **Repository interfaces live in the domain, implementations in infrastructure** (dependency inversion) – the domain defines what it needs (`findById`, `save`, ...), infrastructure fulfills it concretely for Cosmos DB.
5. **Mapping between a domain object and a Cosmos document** (partition key, `id`, `_ts`, etc.) belongs exclusively in `*CosmosRepository.ts`, not in the domain.

## Code conventions

- Prefer readable, explicit code over clever shortcuts.
- Refactor within a single method/object rather than splitting into many small helper functions, unless explicitly requested.
- Composition over inheritance/abstract classes – compose domain objects and services from smaller, self-contained pieces.
- Keep files/modules self-contained and easy to scan as a whole (avoid fragmenting logic across many interdependent small files).
- Frontend (Vue 3): Composition API, `<script setup lang="ts">`, Pinia for state, when shared state across components is needed.

## Cosmos DB

- Choose the partition key based on the aggregate's access pattern (fill in the concrete strategy once the dominant query pattern is known).
- One container per aggregate/bounded context, unless the design calls for a multi-model container instead.
- Repository implementations work exclusively with the domain object at input/output – no leaking of Cosmos-specific types outside `infrastructure/`.

## Commands (fill in with your actual setup)

```bash
npm install              # install dependencies
npm run dev               # local development (frontend)
func start                # run Azure Functions locally
npm run test               # tests
npm run lint                # lint
npm run build                # build
```

## Testing

- Test domain objects in isolation, without Cosmos DB (pure unit tests over entities/value objects).
- Test the use-case/application layer with an in-memory implementation of the repository interface (a fake, not a mocked Cosmos SDK).
- Test Azure Functions handlers only at the request/response mapping level, not business logic (that's already covered by domain tests).

## What Claude should not do

- Do not add business logic to `functions/*/index.ts`.
- Do not use Cosmos SDK types outside `infrastructure/cosmos`.
- Do not create new abstract classes to share behavior between domain objects – prefer composition/interfaces.