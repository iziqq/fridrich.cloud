---
title: Endpointy – jeden soubor na endpoint
type: koncept
sources:
  - raw/2026-09-15-domenova-architektura.md
  - kód: apps/api/src/http/endpoint.ts, apps/portal/src/api/http.ts
updated: 2026-09-15
---

# Endpointy – jeden soubor na endpoint

> Každý endpoint má **jeden soubor na backendu a jeden na frontendu**, oba se
> jmenují `<jméno>.endpoint.ts` a leží ve složce své domény. V souboru je
> všechno, co k HTTP kontraktu patří: metoda, cesta, Valibot schéma requestu
> a response a z nich odvozené typy. Business logika v něm není nikdy.

## Pojmenování

| Co | Konvence | Příklad |
|---|---|---|
| Jméno endpointu | `<sloveso><Podstatné jméno>` v camelCase, stejné na FE i BE | `createGuest`, `changeGuestStatus`, `getBudget` |
| Soubor | `<jméno>.endpoint.ts` | `createGuest.endpoint.ts` |
| Backend – umístění | `apps/api/src/endpoints/<doména>/[<subdoména>/]` | `endpoints/weddy/guests/` |
| Frontend – umístění | `apps/portal/src/<doména>/[<subdoména>/]endpoints/` | `weddy/guests/endpoints/` |
| Schéma těla | `<Jméno>Request` | `CreateGuestRequest` |
| Schéma odpovědi | `<Jméno>Response` | `CreateGuestResponse` |
| Schéma cesty / query (BE, FE query) | `<Jméno>Params`, `<Jméno>Query` | `ListGuestsQuery` |
| Typ | stejné jméno jako schéma (`export type X = v.InferOutput<typeof X>`) | `type CreateGuestResponse` |
| Export na BE | `<jméno>Endpoint` | `createGuestEndpoint` |
| Export na FE | funkce `<jméno>(…)` | `createGuest(weddingId, request)` |

Slovesa: `list` (kolekce), `get` (jeden záznam / výpočet), `create`, `update`
(celý přepis, PUT), `change<Pole>` (PATCH jednoho pole), `delete`.
Výjimky jsou jen tam, kde doména mluví jinak (`register`, `requestLoginCode`,
`verifyLoginCode`, `submitContactMessage`).

## Backend – `defineEndpoint`

```ts
// apps/api/src/endpoints/weddy/guests/createGuest.endpoint.ts
import { GuestInputSchema, GuestSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { createGuest } from '../../../application/weddy/guests.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `POST /api/weddy/weddings/{weddingId}/guests` – přidání hosta. */

export const CreateGuestParams = v.object({ weddingId: v.string() });
export type CreateGuestParams = v.InferOutput<typeof CreateGuestParams>;

export const CreateGuestRequest = GuestInputSchema;
export type CreateGuestRequest = v.InferOutput<typeof CreateGuestRequest>;

export const CreateGuestResponse = GuestSchema;
export type CreateGuestResponse = v.InferOutput<typeof CreateGuestResponse>;

export const createGuestEndpoint = defineEndpoint({
  name: 'createGuest',
  method: 'POST',
  route: 'weddy/weddings/{weddingId}/guests',
  access: 'user',                 // 'public' | 'user'
  params: CreateGuestParams,
  body: CreateGuestRequest,
  response: CreateGuestResponse,  // hlídá typ návratové hodnoty handle
  async handle({ params, body, user }) {
    return {
      status: 201,
      body: await createGuest(weddyDeps(), params.weddingId, body, user.id),
    };
  },
});
```

Co udělá obálka `defineEndpoint` (`apps/api/src/http/endpoint.ts`) za handler:

1. `access: 'user'` → ověří session z cookie; bez ní vrátí `401`. `user` je
   pak v `handle` typově `User`, u `public` je `undefined`.
2. Rozparsuje `params`, `query` (z URL) a `body` (JSON) jejich schématy.
   Neplatný vstup → `400` s `details: [{ field: 'groom.firstName', message }]`
   a `handle` se vůbec nezavolá.
3. Výsledek `{ status, body, headers }` převede na odpověď (`204` bez těla).
4. `DomainError` přeloží na stavový kód (`validation 400`, `unauthorized 401`,
   `forbidden 403`, `notFound 404`, `conflict 409`, `tooManyRequests 429`).
   Cokoli jiného zaloguje a vrátí `500` bez textu chyby.

**Registrace:** endpoint musí být v seznamu v `apps/api/src/index.ts`.
`registerEndpoints()` seskupí endpointy podle cesty a na každou cestu
zaregistruje jednu Azure funkci (runtime nedovolí dvě funkce na stejné cestě)
včetně `OPTIONS`. Duplicitní metoda + cesta shodí start aplikace.

**Co do `handle` patří:** vytáhnout z `params`/`body` argumenty, zavolat
**jeden** use-case, vrátit status a tělo, případně hlavičku (`Set-Cookie`).
**Co nepatří:** podmínky nad daty, výpočty, práce s repozitáři, kontrola
přístupu – to je use-case nebo doména.

## Frontend – `callEndpoint`

```ts
// apps/portal/src/weddy/guests/endpoints/createGuest.endpoint.ts
import { GuestInputSchema, GuestSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/weddy/weddings/{weddingId}/guests` – přidání hosta. */

export const CreateGuestRequest = GuestInputSchema;
export type CreateGuestRequest = v.InferInput<typeof CreateGuestRequest>;

export const CreateGuestResponse = GuestSchema;
export type CreateGuestResponse = v.InferOutput<typeof CreateGuestResponse>;

export function createGuest(
  weddingId: string,
  request: CreateGuestRequest,
): Promise<CreateGuestResponse> {
  return callEndpoint({
    method: 'POST',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/guests`,
    body: { schema: CreateGuestRequest, value: request },
    response: CreateGuestResponse,
  });
}
```

Co udělá `callEndpoint` (`apps/portal/src/api/http.ts`):

1. **Validuje tělo před odesláním.** Neplatná data vyhodí `ApiError(400,
   'ValidationError', …, details)` – stejnou chybu, jakou by vrátil backend,
   takže formulář ukáže chyby u polí bez kolečka na server. Odešle se
   **výstup** schématu (oříznutý, normalizovaný).
2. Pošle požadavek na `/api…` s `credentials: 'include'` (session cookie).
3. Chybovou odpověď rozparsuje `ApiErrorBodySchema` → `ApiError`
   (`status`, `code`, `details`, `fieldErrors`).
4. **Validuje odpověď** schématem `response`. Nesedí-li, je to chyba
   `InvalidResponse`, ne data – rozjetý kontrakt se pozná hned.

Typ requestu na FE je `v.InferInput` (co volající posílá, před transformacemi),
typ odpovědi `v.InferOutput`. Na BE je obojí `InferOutput` (handler dostává
už rozparsovaná data).

## Soulad FE a BE

Schémata endpointu se na FE a BE **píšou zvlášť, ale skládají se ze stejných
stavebních bloků** ve sdíleném jádru (`GuestInputSchema`, `GuestSchema`, …).
Pravidla polí tak existují jednou; v endpoint souborech je jen obálka
(`{ guests, stats }`, `{ status }`). Při změně kontraktu se mění **oba soubory
v jednom commitu** – stejné jméno souboru je najde `find -name 'createGuest.endpoint.ts'`.

## Postup: nový endpoint

1. Pravidla nových polí → schéma ve sdíleném jádru (`packages/<produkt>-shared`), viz [valibot.md](valibot.md).
2. Chování → doménový objekt / doménová funkce; orchestrace → use-case v `application/`.
3. Backend: `endpoints/<doména>/<subdoména>/<jméno>.endpoint.ts` podle vzoru výše.
4. Zaregistrovat v `apps/api/src/index.ts`.
5. Frontend: `<doména>/<subdoména>/endpoints/<jméno>.endpoint.ts` se stejnými schématy.
6. Volat ze store (sdílený stav) nebo z view (jednorázové volání). Akce store
   se **nejmenuje stejně jako endpoint** (`addFamily` volá `createFamily`).
7. Testy: doména a use-case s paměťovým repozitářem, nová pravidla schématu
   v `apps/api/test/schemas.test.ts`.
8. Wiki: tabulka endpointů na stránce subdomény, [index](../index.md), [log](../log.md).

## Související

- [Doménová architektura](domeny.md)
- [Valibot](valibot.md)
- [Backend](backend.md) · [Frontend](frontend.md)
