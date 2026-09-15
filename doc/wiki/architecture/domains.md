---
title: Doménová architektura
type: koncept
sources:
  - raw/2026-09-15-domenova-architektura.md
  - kód: apps/api/src, apps/portal/src, packages/*-shared
updated: 2026-09-15
---

# Doménová architektura

> Backend i frontend se člení **podle domén, ne podle technických vrstev**.
> Stejná doména má stejné jméno a stejné subdomény v `apps/api`, `apps/portal`
> i ve sdíleném jádru `packages/*-shared`. Business logika je vždy v doméně.

## Mapa domén

| Doména | Subdomény | Co řeší | API prefix |
|---|---|---|---|
| `identity` | – | Registrace, bezheslové přihlášení, session | `/api/auth/*` |
| `contact` | – | Kontaktní formulář portálu | `/api/contact` |
| `weddy` | `wedding`, `guests`, `planning`, `budget` | Svatební plánovač IziWeddy | `/api/weddy/*` |
| `budgy` | *(TODO)* | Rozpočet domácnosti IziBudgy | `/api/budgy/*` |

Portál (prezentační web) není business doména – je to obsah a vzhled, viz
[domeny/portal.md](../domeny/portal.md).

### Subdomény `weddy`

| Subdoména | Obsah | Obrazovky | Stránka |
|---|---|---|---|
| `wedding` | Agregát `Wedding` – kořen celé domény: název, datum, **snoubenci**, vlastníci a kontrola přístupu. Dashboard. | Dashboard, Nové plánování, Snoubenci, layout detailu | [weddy-wedding.md](../domeny/weddy-wedding.md) |
| `guests` | Hosté a **rodiny** (skupiny hostů), statistiky | Hosté | [weddy-guests.md](../domeny/weddy-guests.md) |
| `planning` | Sekce přípravy a položky od dodavatelů | Plánování, Detail sekce | [weddy-planning.md](../domeny/weddy-planning.md) |
| `budget` | Rozpočet počítaný z položek | Rozpočet | [weddy-budget.md](../domeny/weddy-budget.md) |

> **Proč snoubenci nejsou samostatná subdoména `couple`:** ženich a nevěsta
> nemají vlastní identitu ani životní cyklus – jsou to hodnotové objekty
> uvnitř agregátu `Wedding`, ukládají se v jednom dokumentu a edituje se s nimi
> i název a datum v jednom formuláři přes jeden endpoint
> (`PUT /weddings/{id}`). Kdyby snoubenci dostali vlastní data nebo endpointy
> (sdílení, profil), vznikne `weddy/couple` podle stejného vzoru.

## Kde doména žije

```
packages/weddy-shared/src/<subdoména>.ts      # sdílené jádro: schémata, výčty, čisté výpočty
apps/api/src/
  domain/weddy/<subdoména>/                   # entity, doménové funkce, porty (repozitáře)
  application/weddy/<subdoména>.ts            # use-casy: načti → ověř přístup → doména → ulož
  endpoints/weddy/<subdoména>/*.endpoint.ts   # HTTP kontrakt, 1 soubor = 1 endpoint
  infrastructure/cosmos/weddyRepositories.ts  # implementace portů nad Cosmos DB
apps/portal/src/weddy/<subdoména>/
  endpoints/*.endpoint.ts                     # volání API, 1 soubor = 1 endpoint
  <subdoména>.store.ts                        # Pinia – sdílený stav subdomény (je-li potřeba)
  *View.vue, *.vue                            # obrazovky a komponenty subdomény
```

Domény bez subdomén (`identity`, `contact`) mají o úroveň méně:
`domain/identity/`, `endpoints/identity/`, `apps/portal/src/identity/`.

## Vrstvy a kam patří logika

| Co | Kam | Příklad |
|---|---|---|
| Tvar dat po drátě, pravidla polí (povinné, délka, formát, rozsah) | Valibot schéma ve sdíleném jádru | `GuestInputSchema`, `PlanningItemInputSchema` |
| Čisté výpočty, které potřebuje i frontend | Sdílené jádro | `calculateBudget`, `calculateGuestStats`, `groupIntoFamilies` |
| Invarianty a chování nad stavem | Doménový objekt / doménová funkce | `Wedding.assertAccessibleBy`, `Guest.joinFamily`, `rewriteFamily`, `LoginCode.verify` |
| Výchozí hodnoty, bezpečnostní pravidla | Doména | nový host `draft` + `adult`; jednotná chyba přihlášení |
| Orchestrace (načti, zkontroluj přístup, zavolej doménu, ulož) | Use-case v `application/` | `updateFamily` |
| HTTP: metoda, cesta, parsování vstupu, stavový kód, cookie | Endpoint soubor | `createGuest.endpoint.ts` |
| Cosmos DB, e-maily, kryptografie | `infrastructure/` | `guestCosmosRepository` |
| Stav obrazovek, optimistické změny, filtry a řazení | Frontendový store / view | `useGuestsStore` |

Sdílené jádro (`packages/*-shared`) je **součást domény** (shared kernel):
co je v něm, platí stejně na frontendu i backendu a nesmí záviset na ničem
z `apps/`, databázi ani UI.

## Pravidla závislostí

1. **Domény se nevolají navzájem.** Jediné, co sdílejí, je identita
   uživatele (`userId`) předaná obálkou endpointu. Kdyby modul vyrostl, jde
   vyříznout bez zásahu do ostatních.
2. **Subdomény weddy smí záviset na `wedding`** (kořen) – každý use-case volá
   `loadWeddingFor()`, které ověří přístup. Mezi `guests`, `planning`
   a `budget` přímé závislosti nejsou; `budget` čte položky plánování přes
   port repozitáře, frontend ho načítá vlastním endpointem.
3. **Směr závislostí na backendu:** `endpoints → application → domain ← infrastructure`.
   Doména nezná HTTP, Azure Functions ani Cosmos SDK.
4. **Frontend:** view → store → endpoint soubor → `api/http.ts`. Komponenta
   nevolá `fetch` ani `callEndpoint` přímo, vždy přes endpoint soubor.
   Obrazovka smí zavolat endpoint bez store, když výsledek nesdílí s nikým
   dalším (např. registrace, rozpočet).
5. **Kompozice, ne dědičnost** – žádné abstraktní třídy mezi doménovými
   objekty; sdílené chování se skládá z funkcí a hodnotových objektů.

## Související

- [Endpointy](endpointy.md) – konvence souboru endpointu na FE i BE
- [Valibot](valibot.md) – typy a validace
- [Backend](backend.md), [Frontend](frontend.md)
- [Rozhodnutí](../rozhodnuti.md) – proč je architektura taková
