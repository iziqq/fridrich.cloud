---
title: Question – hashing user data
type: source
date: 2026-09-17
author: Libor Fridrich
language: translated from Czech
---

# Question – hashing user data

English translation of the project owner's question of 2026-09-17.

---

I would quite like user data to be hashed somehow. I think it would be good so
that it is not legally attackable. Or what do you think?

*(Follow-up in the same conversation: "you can delete the existing data".)*

---

## The answer given, in short

Hashing is one-way, so it cannot be used for anything the application has to
show back – guest names or budget entries would simply be lost. It is the right
tool only for values that are **compared and never displayed**, and those are
now hashed (see [architecture/security.md](../wiki/architecture/security.md)).

What the question is really after is **encryption** or pseudonymisation. GDPR
Art. 32 names both as examples of appropriate measures, not as a duty; the
concrete legal benefit of encryption is Art. 34(3)(a) – no need to notify data
subjects after a breach of unintelligible data.

Agreed next step: hash what deserves hashing (rate-limit keys, the IP of a
contact message, the invitation e-mail lookup) with HMAC and a secret pepper,
and treat field-level encryption of the product payloads as a separate,
later decision. Existing documents are not migrated – the owner agreed they can
be thrown away.
