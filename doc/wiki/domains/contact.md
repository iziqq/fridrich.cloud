---
title: contact domain
type: domain
sources:
  - raw/portalSpec.md (ch. 3.7)
  - code: apps/api/src/{domain,application,endpoints}/contact, apps/portal/src/contact, apps/portal/src/sections/ContactSection.vue
updated: 2026-09-15
---

# `contact` domain

> The portal contact form – the main business goal of the website (an enquiry).
> **The only public (unauthenticated) write endpoint**, so it has its own protection.

## Rules

| Field | Rule (`ContactMessageInputSchema`) |
|---|---|
| `name` | required, max. 100 characters |
| `email` | valid e-mail, stored lowercase |
| `message` | 10–5000 characters |

- **Honeypot** – hidden field `website`; filled in = a bot, the form pretends
  success and sends nothing (handled in `ContactSection.vue`).
- **Rate limit** 5 messages per hour per IP (use case).
- The message is **saved to `contactMessages` and also e-mailed** to
  `CONTACT_INBOX` – a mail outage does not lose it. Content is escaped in the HTML e-mail.

## Code

| Layer | File |
|---|---|
| Schema | `packages/shared/src/contact.ts` |
| Domain | `apps/api/src/domain/contact/ContactMessage.ts` (+ `ContactMessageRepository`) |
| Use case | `apps/api/src/application/contact/submitContactMessage.ts` |
| BE endpoint | `apps/api/src/endpoints/contact/submitContactMessage.endpoint.ts` |
| FE endpoint | `apps/portal/src/contact/endpoints/submitContactMessage.endpoint.ts` |
| UI | `apps/portal/src/sections/ContactSection.vue` – validates with the same schema before sending |

## Endpoint

| Endpoint | Method and path | Request → Response |
|---|---|---|
| `submitContactMessage` | `POST /api/contact` | `{ name, email, message }` → `202 { message }` |

## Related

- [Portal](portal.md) · [Endpoints](../architecture/endpoints.md)
