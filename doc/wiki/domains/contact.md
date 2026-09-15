---
title: Doména contact
type: domena
sources:
  - raw/portal-specifikace.md (kap. 3.7)
  - kód: apps/api/src/{domain,application,endpoints}/contact, apps/portal/src/contact, apps/portal/src/sections/ContactSection.vue
updated: 2026-09-15
---

# Doména `contact`

> Kontaktní formulář portálu – hlavní obchodní cíl webu (poptávka).
> **Jediný veřejný (nepřihlášený) zápisový endpoint**, proto má vlastní ochranu.

## Pravidla

| Pole | Pravidlo (`ContactMessageInputSchema`) |
|---|---|
| `name` | povinné, max. 100 znaků |
| `email` | platný e-mail, uloží se malými písmeny |
| `message` | 10–5000 znaků |

- **Honeypot** – skryté pole `website`; vyplněné = robot, formulář se tváří
  úspěšně a nic neodešle (řeší `ContactSection.vue`).
- **Rate limit** 5 zpráv za hodinu na IP (use-case).
- Zpráva se **uloží do `contactMessages` a zároveň pošle e-mailem** na
  `CONTACT_INBOX` – výpadek pošty ji neztratí. Obsah se v HTML e-mailu escapuje.

## Kód

| Vrstva | Soubor |
|---|---|
| Schéma | `packages/shared/src/contact.ts` |
| Doména | `apps/api/src/domain/contact/ContactMessage.ts` (+ `ContactMessageRepository`) |
| Use-case | `apps/api/src/application/contact/submitContactMessage.ts` |
| Endpoint BE | `apps/api/src/endpoints/contact/submitContactMessage.endpoint.ts` |
| Endpoint FE | `apps/portal/src/contact/endpoints/submitContactMessage.endpoint.ts` |
| UI | `apps/portal/src/sections/ContactSection.vue` – validuje stejným schématem před odesláním |

## Endpoint

| Endpoint | Metoda a cesta | Request → Response |
|---|---|---|
| `submitContactMessage` | `POST /api/contact` | `{ name, email, message }` → `202 { message }` |

## Související

- [Portál](portal.md) · [Endpointy](../architektura/endpointy.md)
