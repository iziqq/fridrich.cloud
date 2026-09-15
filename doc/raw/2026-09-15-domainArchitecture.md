---
title: Brief – domain architecture, endpoints and Valibot
type: source
date: 2026-09-15
author: Libor Fridrich
language: translated from Czech
---

# Brief – domain architecture, endpoints and Valibot

English translation of the project owner's request (the owner wants all
documentation in English; the Czech wording is in the conversation of
2026-09-15). Immutable source – what follows from it is compiled into the
wiki (see [wiki/log.md](../wiki/log.md), entry of 2026-09-15).

---

I would like you to add more documentation for the AI agent. I would like both
the backend (API) and the frontend to be written in a domain-oriented way. For example:
- Weddy will be one big domain
  - Budget will be a domain that communicates with API endpoints.
  - Couple domain
  - Guests domain
etc.

Next, frontend communication with the API:
Every endpoint will have a separate file, e.g. getCouple.endpoint. That file will define the response type and the request type.

I would like the backend to be solved in a similar style. Everything related to an endpoint should live with the endpoint. Business logic always in the domain.

All types should be handled through the Valibot package. We will also handle validation through it.

Do this following Andrej Karpathy's LLM Wiki concept!

Whatever needs to be changed, change it.

