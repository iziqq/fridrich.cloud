---
title: Security – what is hashed, what is not, and why
type: concept
sources:
  - raw/2026-09-17-hashUserData.md
  - code: apps/api/src/infrastructure/crypto.ts, apps/api/src/domain/shared/Fingerprint.ts
updated: 2026-09-17
---

# Security – what is hashed, what is not, and why

> Hashing is a one-way function, so it fits values that are **only ever
> compared**, never shown. Anything the application has to display again
> (guest names, budget entries) cannot be hashed – that is a job for
> encryption. This page says which is which and what is still open.

## The legal part, briefly

GDPR (Art. 32) requires measures **appropriate to the risk** and names
pseudonymisation and encryption as examples; it does not mandate either. So
"the data was not hashed" is not in itself a flaw – "the measures did not match
the risk" is. The concrete benefit of encryption is Art. 34(3)(a): after a
breach, data subjects need not be notified individually if the data is
unintelligible to the attacker.

> ⚠️ Written by the agent from the code, **not legal advice** – same caveat as
> the legal documents ([personalData.md](personalData.md)).

## What is hashed

| Value | Where | Function | Why a hash is right |
|---|---|---|---|
| Session tokens, e-mail activation links | `sessions`, `tokens` | SHA-256 | 32 random bytes; the server only compares them, the user never sees the stored form |
| Login code | `loginCodes` | SHA-256 of the code **with the challenge id** | Six digits are a million options; the defence is the 10-minute validity and the attempt counter, not the hash |
| IP address / e-mail in rate-limit keys | `rateLimits` | **HMAC-SHA256 with a pepper** | Only ever compared ("is this the same source?"); the container then holds no readable personal data |
| IP address of a contact message | `contactMessages` | HMAC-SHA256 | Kept to spot abuse; comparing two messages works from the fingerprint |
| E-mail of a pending invitation (lookup) | `weddingInvitations.emailHash` | HMAC-SHA256 | The lookup after registration does not need to know the address |

**Why HMAC and not a plain hash.** Tokens are long and random, so a plain
SHA-256 cannot be reversed. IP addresses and e-mails are not: there are four
billion IPv4 addresses and e-mails can be taken off a list, so a plain hash
would be brute-forced in minutes. The fingerprint therefore mixes in a secret
pepper (`PSEUDONYM_PEPPER`), without which it cannot be recomputed.

- Implementation: `fingerprint` in `infrastructure/crypto.ts`, port
  `domain/shared/Fingerprint.ts`.
- The pepper is **required in production** and lives only in the Azure
  Application settings, never in the repository or in a GitHub secret – the API
  reads it at runtime, no workflow needs it. Outside production a development
  value is used so the app starts without secrets.
- A missing pepper **throws where the fingerprint is taken**, not while the
  configuration is read, so it breaks only sign-in, the contact form and
  invitations instead of the whole API.
- **Changing the pepper invalidates existing fingerprints** – counters reset
  (they live 24 hours anyway) and pending invitations stop being found.
- The value is normalised before hashing (trim, lowercase), so
  `Jan@Example.com` and `jan@example.com` give the same fingerprint.

## What is deliberately not hashed

| Value | Why not |
|---|---|
| Account e-mail and name | The application shows them and sends mail to them; the account holder entered them knowingly |
| Invitation e-mail (the address itself) | The invitation has to be sent and the admin sees who is pending; only the **lookup** uses the fingerprint |
| Guests, planning items, budget entries | The product exists to show them back |

For these, hashing is the wrong tool – the options are minimisation (collect
less), retention (keep it shorter) and encryption.

## What already protects the data

- Cosmos DB encrypts at rest by default; the connection runs over TLS.
- The API authenticates to Cosmos with a managed identity where no key is set.
- No passwords exist at all (passwordless sign-in), so there are none to leak.
- Identity data lives in different containers than product data, which is keyed
  by `userId` / `weddingId`.
- Minimisation and retention: fields that were not used were dropped (the
  couple's birth year, e-mail, phone), TTLs clean up temporary data, an
  inactive account is deleted after a year ([personalData.md](personalData.md)).

## Open, in order of value

1. **Separate development from production.** `apps/api/local.settings.json` may
   point at the production database, so a developer machine holds production
   access. Cheapest and biggest win.
2. **Field-level encryption** of the product payloads – guest names and notes
   first (data about people who never agreed to anything), then budget entries.
   A key in Azure Key Vault, a `Cipher` port in the domain, encryption only in
   `infrastructure/cosmos`. Then a leaked database key yields ciphertext.
   Cost: no server-side filtering or sorting on those fields (we filter on the
   client anyway), key rotation, and a migration of existing documents.
3. **A breach procedure** written down – Art. 33 gives 72 hours, which cannot
   be improvised.

Never: hashing data that has to be displayed, home-made cryptography, or
encrypting ids and partition keys (that breaks queries and TTL).

## Related

- [personal data](personalData.md) · [data in Cosmos DB](dataCosmos.md) · [identity](../domains/identity.md)
- Source: [raw/2026-09-17-hashUserData.md](../../raw/2026-09-17-hashUserData.md)
