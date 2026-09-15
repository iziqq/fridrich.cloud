---
title: Portal www.fridrich.cloud
type: domain
sources:
  - raw/portalSpec.md
  - code: apps/portal/src/{components,sections,content,views}, packages/design
updated: 2026-09-15
---

# Portal `www.fridrich.cloud`

> Presentation website of Libor Fridrich – **custom software development**. The
> main goal is an enquiry through the contact form; it is also the gateway to the
> products. Visual style inspired by **Cyberpunk 2077**. The portal is not a
> business domain but content and look; its only API calls are
> [contact](contact.md) and sign-in ([identity](identity.md)). Website texts are Czech.

The full specification (section copy, effects, assets) is in the source
[raw/portalSpec.md](../../raw/portalSpec.md). This page holds the rules every
change must respect.

## Content and navigation

Menu: *O mně · Služby · Vývoj · Projekty · Kontakt · Přihlásit se* (About me ·
Services · Development · Projects · Contact · Sign in); after sign-in the user's
name → account. The active section is highlighted while scrolling (`useActiveSection`).

| Section | Content |
|---|---|
| Hero | `LIBOR FRIDRICH` / `VÝVOJ NA MÍRU` (custom development), CTA `MÁM PROJEKT` (I have a project) → contact, `JAK PRACUJI` (how I work) → development |
| About me | 10+ years full stack, large international companies as well as smaller custom development, industries strip |
| Services | Custom web applications · Cloud (Azure) · Integration and automation · Consulting and code review |
| Development | **Key section** – 6 steps: kick-off meeting → brief confirmation → analysis → mocked demo → main development with a test environment → production |
| Projects | IziWeddy (in development), IziBudgy (coming soon) |
| Contact | Form name/e-mail/message + honeypot, direct contacts |

Copy is not hard-coded in components but lives in `apps/portal/src/content/site.ts`.

## Binding rules

> ⚠️ **Client names are never published on the website** – nor logos, case
> studies or screenshots that would identify a client. Only industries are
> mentioned (industrial manufacturing, automotive, consumer goods, contract development).

- **Testimonials** are not shown until there are real quotes.
- **No official game assets** (logo, the Refrigerator Deluxe font, screenshots) –
  inspired by the style, not copied.
- **Signal yellow only once per screen**; never yellow text on cyan or vice versa;
  colour always accompanied by text or an icon.
- **Body text never in uppercase**, `line-height: 1.7`, max. `70ch`.
- **Bevelled corners instead of rounded** (`clip-path`), 12-column grid, max. width `1200px`, gutter 24 px (mobile 16 px).
- **Animations** 120–320 ms, never looping outside the viewport; `prefers-reduced-motion` disables glitch, scanlines, typewriter and the growing timeline.
- **Self-hosted fonts** (`@fontsource`) – no calls to third-party domains.

## Design tokens (`packages/design`)

| Token | Value | Use |
|---|---|---|
| `--cp-black` | `#050506` | background |
| `--cp-panel` | `#0E0E11` | cards, panels |
| `--cp-line` | `#1F1F25` | borders |
| `--cp-yellow` | `#FCEE0A` | signal – CTA, active state |
| `--cp-cyan` | `#00F0FF` | secondary accent, HUD |
| `--cp-magenta` | `#FF003C` | errors, glitch |
| `--cp-green` | `#39FF7A` | success |
| `--cp-text` | `#E8E8EA` | text |
| `--cp-muted` | `#8A8A93` | secondary text (do not use a darker grey – contrast) |

Typography: Rajdhani (headings), Chakra Petch (body), JetBrains Mono (HUD, numbers).

## Accessibility and performance

- Text contrast at least 4.5:1, headings 3:1; visible `:focus-visible` (2 px yellow outline).
- Touch targets at least 44 × 44 px; "Přeskočit na obsah" (skip to content) link; form with `<label>` and `aria-describedby`.
- Targets: Lighthouse mobile ≥ 90, LCP < 2.5 s, CLS < 0.1, JS gzip < 150 kB.
- SEO: unique title/description, Open Graph, JSON-LD `Person` + `ProfessionalService`, `sitemap.xml`, `robots.txt`.

## Open items

Cookieless analytics, blog, portrait photo and company registration number in
the footer – see [decisions.md](../decisions.md#open-questions).

## Related

- [Frontend](../architecture/frontend.md) · [contact](contact.md)
