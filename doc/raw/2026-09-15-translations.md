---
title: Brief – translations (i18n)
type: source
date: 2026-09-15
author: Libor Fridrich
language: translated from Czech
---

# Brief – translations (i18n)

English translation of the project owner's request of 2026-09-15 and of the
answers given to the agent's clarifying questions.

---

## Request

We should implement some translations. i18n will probably be best. Put all the
labels into it. At the same time this goes into CLAUDE.md.

## Answers to clarifying questions

| Question | Answer |
|---|---|
| Which languages? | Czech + English |
| How is the language chosen? | Switcher + remembered choice (default by browser, stored in localStorage; URLs stay the same) |
| Translate validation messages from shared schemas and texts from the API (e-mails, error messages) too? | Everything including e-mails (schemas and API return message keys, the frontend translates them; e-mails in the user's language stored with the account) |
| Legal documents (privacy policy, terms)? | Czech only |
