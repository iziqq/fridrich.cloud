---
title: Portal www.fridrich.cloud
type: domain
sources:
  - raw/portalSpec.md (content, navigation; its cyberpunk design system is superseded)
  - raw/2026-09-15-glassDesign.md
  - code: apps/portal/src/{components,sections,content,views}, packages/design
updated: 2026-09-15
---

# Portal `www.fridrich.cloud`

> Presentation website of Libor Fridrich – **custom software development**. The
> main goal is an enquiry through the contact form; it is also the gateway to the
> products. Visual style **Glass** – dark, warm background with orange glows and frosted glass
> surfaces (inspired by Apple, not a copy). The portal is not a
> business domain but content and look; its only API calls are
> [contact](contact.md) and sign-in ([identity](identity.md)). Website texts are Czech and English (switcher in the navigation).
>
> Personal data is collected under the privacy policy and terms at
> `/ochrana-osobnich-udaju` and `/obchodni-podminky` ([personalData.md](../architecture/personalData.md)).

The full specification (section copy, effects, assets) is in the source
[raw/portalSpec.md](../../raw/portalSpec.md). This page holds the rules every
change must respect.

## Content and navigation

Menu: *O mně · Služby · Vývoj · Projekty · Kontakt · Přihlásit se* (About me ·
Services · Development · Projects · Contact · Sign in); after sign-in the user's
name → account. *Přihlásit se* is hidden when the GDPR switch is off. The bar is a floating glass pill that **stays visible while scrolling** (it used to hide on scroll down) and shows the **fox logo** (`apps/portal/src/assets/logo.svg`). The active section is highlighted while scrolling (`useActiveSection`).

| Section | Content |
|---|---|
| Hero | `LIBOR FRIDRICH` / `VÝVOJ NA MÍRU` (custom development), CTA `MÁM PROJEKT` (I have a project) → contact, `JAK PRACUJI` (how I work) → development |
| About me | 10+ years full stack, large international companies as well as smaller custom development, industries strip |
| Services | Custom web applications · Cloud (Azure) · Integration and automation · Consulting and code review |
| Development | **Key section** – 6 steps: kick-off meeting → brief confirmation → analysis → mocked demo → main development with a test environment → production |
| Projects | IziWeddy (in development), IziBudgy (coming soon); the *Otevřít aplikaci* (Open app) button only with the GDPR switch on |
| Contact | Form name/e-mail/message + honeypot, information notice with a link to the privacy policy, direct contacts. With the switch off: only the e-mail address and a `Napsat e-mail` (Write an e-mail) `mailto:` button |
| Footer | Products, e-mail, links *Ochrana osobních údajů* (Privacy) and *Obchodní podmínky* (Terms); bottom line with name and IČO (the registered address is in the legal documents) |
| Legal pages | `/ochrana-osobnich-udaju`, `/obchodni-podminky` – `LegalView.vue`, content in `content/legal.ts` |

Copy is not hard-coded in components: texts are in the `portal.*` catalog (`apps/portal/src/i18n/locales/portal.ts`, cs + en), structural data (ids, stack, status, links, company details) in `apps/portal/src/content/site.ts`. Legal documents (`content/legal.ts`) are Czech only.

## Binding rules

> ⚠️ **Client names are never published on the website** – nor logos, case
> studies or screenshots that would identify a client. Only industries are
> mentioned (industrial manufacturing, automotive, consumer goods, contract development).

- **Testimonials** are not shown until there are real quotes.
- **Inspired by Apple, never copied** – no Apple logos, SF fonts or product imagery.
- **Orange is the accent, not the surface**: primary action, active state, numbers,
  small dots; card titles and body text stay white/grey. Colour is always accompanied by text.
- **Text on orange is dark** (`--color-on-accent`) – white on orange is below 3 : 1.
- **Sentence case**: headings and messages are never uppercase; uppercase only for short
  labels (`.mono` – eyebrows, table headers). Body `line-height: 1.7`, max. `70ch`.
- **Rounded glass surfaces** (`.glass`): cards `--radius` 18 px, large blocks 28 px,
  buttons, chips, navigation and badges are pills. Max. width `1200px`, gutter 24 px (mobile 16 px).
- **Responsive** on mobile, tablet (`--tablet`, ≥ 768 px) and notebook (`--notebook`, ≥ 1024 px) – breakpoints in [frontend.md](../architecture/frontend.md#responsive-layout-and-breakpoints). The *Vývoj* (Development) timeline is vertical up to tablet and a horizontal 3 × 2 stepper on notebook.
- **Animations** 120–320 ms, never looping; `prefers-reduced-motion` removes transitions and the scroll reveal,
  `prefers-reduced-transparency` replaces glass with solid surfaces, browsers without
  `backdrop-filter` get a solid fallback.
- **Self-hosted fonts** (`@fontsource`) – no calls to third-party domains.

## Design: Glass

**Why the change:** the owner found the cyberpunk look too generic. Glass keeps the dark
mood of the brand but reads calmer and more premium; orange replaces the neon yellow/cyan pair.

| Piece | Where | Content |
|---|---|---|
| Tokens | `packages/design/src/theme-glass.css` | palette, fonts, radii, blur, shadow; orange glows under the page (`body::before`, not on IziWeddy pages) |
| Effects | `packages/design/src/effects.css` | `.glass`, `.glass-strong`, `.accent-glow`, `.text-gradient`, `.reveal`, reduced motion/transparency fallbacks |
| Fonts | `packages/design/src/fonts.css` | Inter 400/500/600/700, latin + latin-ext, self-hosted |
| Components | `AppButton` (orange pill / glass pill), `SectionHeading`, `SectionLabel` (glass pill with an orange dot), `SiteNav` (floating glass pill, always visible, logo) | `apps/portal/src/components` |
| Logo and favicon | `apps/portal/src/assets/logo.svg` (fox, transparent – used in the nav); `apps/portal/public/favicon.svg` = the same logo on a dark rounded square, because its white eyes would vanish on a light browser tab | `index.html` links `/favicon.svg` |
| E-mails | `apps/api/src/application/identity/emails.ts` | same palette with solid colours (e-mail clients have no blur) |

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0B0B0E` | page background |
| `--color-surface` / `-strong` | white 5 % / 9 % | glass surfaces, hover |
| `--color-border` / `-strong` | white 10 % / 18 % | surface edges, hover |
| `--color-text` | `#F5F5F7` | text |
| `--color-muted` | `#A1A1AA` | secondary text (darkest grey that keeps 4.5 : 1) |
| `--color-accent` | `#FF7A1A` | primary action, active state, numbers |
| `--color-accent-strong` / `-soft` | `#FF9A4D` / `#FFB27A` | gradient top, links and labels |
| `--color-accent-glow` | orange 35 % | glows, focus ring of inputs |
| `--color-on-accent` | `#1A0C02` | text on orange |
| `--color-danger` / `--color-success` | `#FF5C50` / `#34D399` | errors / success |
| `--radius-sm` / `--radius` / `--radius-lg` / `--radius-pill` | 12 / 18 / 28 / 999 px | inputs / cards / large blocks / buttons, chips |
| `--glass-blur` | 24 px | `backdrop-filter` of glass surfaces |

Typography: Inter everywhere, headings weight 650–700 with negative tracking (-0.025em, hero -0.04em).

## Accessibility and performance

- Text contrast at least 4.5:1, headings 3:1 – on glass too (surfaces are max. 9 % white over `#0B0B0E`); visible `:focus-visible` (2 px orange outline).
- Touch targets at least 44 × 44 px; "Přeskočit na obsah" (skip to content) link; form with `<label>` and `aria-describedby`.
- Targets: Lighthouse mobile ≥ 90, LCP < 2.5 s, CLS < 0.1, JS gzip < 150 kB.
- SEO: unique title/description, Open Graph, JSON-LD `Person` + `ProfessionalService`, `sitemap.xml`, `robots.txt`.

## Open items

Cookieless analytics (would require a privacy policy update), blog, portrait photo
in the footer – see [decisions.md](../decisions.md#open-questions).

## Related

- [Frontend](../architecture/frontend.md) · [contact](contact.md) · [Personal data](../architecture/personalData.md)
