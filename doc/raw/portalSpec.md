# 🌃 Portal `www.fridrich.cloud`

> Translated from the Czech original; the Czech text is in git history (commit 8db5e0a, file doc/portal.md).

The presentation website of Libor Fridrich – **custom development**. The goal is to generate inquiries:
a visitor must understand within a few seconds what I do, who I have done it for and how
the collaboration works. At the same time it is the gateway to my own products
(IziWeddy, IziBudgy).

Visual style: **Cyberpunk 2077** – dark background, signal yellow, neon
cyan, angular technical typography, glitch effects and HUD elements.

---

## Contents

1. [Goals and target audience](#1-goals-and-target-audience)
2. [Navigation](#2-navigation)
3. [Page sections](#3-page-sections)
4. [Design system](#4-design-system)
5. [Effects and animations](#5-effects-and-animations)
6. [Images and media](#6-images-and-media)
7. [Components](#7-components)
8. [Accessibility](#8-accessibility)
9. [Performance and SEO](#9-performance-and-seo)
10. [Application structure](#10-application-structure)
11. [Open questions](#11-open-questions)

---

## 1. Goals and target audience

| | |
|---|---|
| **Primary goal** | An inquiry via the contact form |
| **Secondary goals** | Show experience from large companies and my own products as proof of capability; explain how the collaboration works |
| **Target audience** | Companies and entrepreneurs looking for custom development of web and cloud applications |
| **Tone** | Confident, technical, specific. No empty marketing phrases. |
| **Devices** | Mobile-first, but for this target audience desktop is just as important |

---

## 2. Navigation

A sticky "pill" bar floating above the content – a dark panel with rounded ends,
a thin light border and a subtle shadow.

```
┌────────────────────────────────────────────────────────────────────┐
│  ⟨logo⟩   O MNĚ   SLUŽBY   VÝVOJ   PROJEKTY   KONTAKT │ PŘIHLÁSIT SE │
└────────────────────────────────────────────────────────────────────┘
```

| Item | Target |
|---|---|
| **O mně** (About me) | `/#o-mne` |
| **Služby** (Services) | `/#sluzby` |
| **Vývoj** (Development) | `/#vyvoj` – how the collaboration works, step by step |
| **Projekty** (Projects) | `/#projekty` |
| **Kontakt** (Contact) | `/#kontakt` |
| *(separator)* | vertical line `--cp-line` |
| **Přihlásit se** (Log in) | `/prihlaseni` |

> **References** are not in the menu yet. Once client testimonials are available,
> the item will be inserted between *Vývoj* and *Projekty* – both the section and the component are
> prepared for it in [section 3.6](#36-references-later).

### Behavior

- Items are in **uppercase**, `letter-spacing: 0.08em`, font Rajdhani 600.
- The **active section** is highlighted in signal yellow (`--cp-yellow`) – it is tracked
  with an `IntersectionObserver`, not just by clicking.
- **Hover:** a short glitch shift (±2 px) + recoloring to yellow.
- **Přihlásit se** is visually separated – lighter text; after login it changes
  to the user's name with a dropdown menu (*Můj účet* (My account), *IziWeddy*, *Odhlásit* (Log out)).
- **Mobile (< 768 px):** logo + menu icon; when opened, a **fullscreen overlay**
  with the items stacked vertically, animated like a terminal "boot sequence".
- The bar hides when scrolling down and comes back when scrolling up.

---

## 3. Page sections

### 3.1 Hero

An intro screen spanning the full viewport height.

- **Overline** (mono, cyan): `// FRIDRICH.CLOUD`
- **Heading (glitch):** `LIBOR FRIDRICH`
- **Subheading:** `VÝVOJ NA MÍRU` (Custom development)
- **Lead:** `10 let full stack vývoje. Weby a aplikace na míru – od analýzy po produkci.` (10 years of full stack development. Custom websites and applications – from analysis to production.)
- **CTA:** primary `MÁM PROJEKT` (I have a project) (→ contact), secondary `JAK PRACUJI` (How I work) (→ development).
- **Background:** a dark neon city shot with a duotone gradient, overlaid with scanlines
  and noise; at the bottom a smooth transition into the background color.
- **HUD decoration:** corner marks, bottom left a "typewriter" listing of technologies
  (`Vue 3 · TypeScript · .NET · Azure · Cosmos DB`).

### 3.2 About me

A portrait with a duotone filter (yellow/cyan) and beveled corners, next to it text in the first
person.

**Text content:**

- **10 years of experience** in full stack development – frontend, backend and databases.
- Development for **large international companies** across industries. Some engagements led
  directly, some under contractor companies.
- Alongside corporate projects also **smaller custom development** – where the customer
  needs to sit down with a person who will also program it.

> ⚠️ **Client names are not written on the website.** The client's decision: specific
> brands are not mentioned, so that there is nothing to deal with regarding contractual restrictions. Instead
> only **industries** are mentioned. This rule also applies to future texts, logos,
> case studies and screenshots – nothing from which a client could be identified.

**Stat strip** – large numbers in a mono font with a neon glow:

| Number | Caption |
|---|---|
| `10+` | let praxe (years of experience) |
| `4` | odvětví (industries) |
| `FULL STACK` | frontend · backend · cloud |

**Industry strip** below the text – monochrome (`--cp-muted`), brightens on hover,
above it the mono label `// ODVĚTVÍ, VE KTERÝCH JSEM PRACOVAL` (// INDUSTRIES I HAVE WORKED IN):
industrial manufacturing, automotive, consumer goods, contract development.

### 3.3 Services

A grid of cards (1 column mobile / 2 tablet / 3 desktop). Card = icon, title,
two to three sentences, a list of key technologies.

| Service | Content |
|---|---|
| **Custom web applications** | Design and development from scratch – frontend, backend, database |
| **Cloud solutions (Azure)** | Architecture, deployment, operations, cost optimization |
| **Integration and automation** | Connecting systems, APIs, data flows, replacing manual work |
| **Consulting and code review** | Architecture assessment, technical audit, team guidance |

The card has a beveled top-left corner and a neon frame lights up on hover.

### 3.4 Development – how it works

**The key section of the website.** A customer considering custom development is most afraid
of not knowing what they are getting into. This section shows them the whole process up front.

Six steps, each with a sequence number in a mono font (`01`–`06`), a title, two
to three sentences and the output that comes out of the step:

| # | Step | What happens | Output |
|---|---|---|---|
| `01` | **Initial meeting** | We meet and go through what you need and why. I mainly ask about what the result should solve, not about what it should look like. | Meeting notes |
| `02` | **Confirming the brief** | I write down the requirements in my own words and we confirm that we understood each other the same way. | Agreed brief |
| `03` | **Analysis** | I verify that the brief makes sense technically and economically, and propose the solution, scope, price and deadline. | Solution proposal, price, deadline |
| `04` | **Demo** | I build a **mocked demo** – clickable, but without real logic yet. On it we agree on the look and flows **before expensive code gets written**. | Clickable demo |
| `05` | **Main development** | The real application is built. I continuously deploy it to a test environment, where you **test it even before launch**. | Debugged application on test |
| `06` | **Production** | Deployment to live operation, handover and further support. | Running application |

**Why this way** – a short paragraph below the steps: thanks to the demo in the fourth step,
changes to the look and flows are handled where they are cheap. We only go into real development with
what has been agreed.

**Appearance:**
- **Mobile:** a vertical timeline – a neon line on the left with numbered nodes on it,
  the step content on the right.
- **Desktop:** a horizontal HUD stepper, steps connected by a line with arrows.
- The currently displayed step lights up yellow on scroll, the others stay
  in `--cp-muted` – the line "fills up" like a progress bar.
- Step numbers in `JetBrains Mono` with a subtle glow.
- The section is closed by the CTA `ZAČNEME PRVNÍM KROKEM` (Let's start with the first step) → contact.

### 3.5 Projects

My own products as proof of capability. Large full-width cards.

| Project | Status | Description | Link |
|---|---|---|---|
| **IziWeddy** | In development | Wedding planner – guests, preparations, budget in one place | `/projekty/iziweddy` → `/izi-weddy` |
| **IziBudgy** | In preparation | Household budget – overview of income, expenses and savings | `/projekty/izibudgy` |

The card contains: an application preview, title, status badge, description, technologies
used and a button. The status badge is conveyed by color **and by text**
(`VE VÝVOJI` (In development) yellow, `PŘIPRAVUJEME` (Coming soon) cyan, `SPUŠTĚNO` (Launched) green).

### 3.6 References *(later)*

Not displayed yet – I don't have real client testimonials, and made-up ones don't belong there.

Once they exist, the section will be enabled between *Vývoj* and *Projekty*: a carousel of testimonials (text, name,
position, company, possibly logo), above the testimonial the mono label `// KLIENT 01` (// CLIENT 01).
The `TestimonialCard` component and the menu item will be added at the same time.

### 3.7 Contact

- Form: **Jméno** (Name), **E-mail**, **Zpráva** (Message) (+ a hidden honeypot against bots).
- Next to the form, direct contacts – e-mail, LinkedIn, GitHub.
- It is submitted via `POST /api/contact`; the states *odesílám → odesláno → chyba* (sending → sent → error) are
  printed as terminal lines.
- Consent to the processing of personal data with a link to the policy.

### 3.8 Footer

Logo, `© 2026 Libor Fridrich`, IČO (company registration number), a link to the privacy policy,
a link to the products. A thin neon line above the footer.

---

## 4. Design system

Tokens live in `packages/design` as CSS variables, so that the product
applications can adopt them too.

### 4.1 Colors

| Token | Value | Usage |
|---|---|---|
| `--cp-black` | `#050506` | Page background |
| `--cp-panel` | `#0E0E11` | Cards, panels, bar |
| `--cp-line` | `#1F1F25` | Borders, separators, grid |
| `--cp-yellow` | `#FCEE0A` | **Signal color** – CTA, active state, emphasis |
| `--cp-cyan` | `#00F0FF` | Secondary accent – captions, links, HUD |
| `--cp-magenta` | `#FF003C` | Errors, warnings, glitch layer |
| `--cp-green` | `#39FF7A` | Success, "launched" status |
| `--cp-text` | `#E8E8EA` | Body text |
| `--cp-muted` | `#8A8A93` | Secondary text, captions |

**Rules:**
- Yellow is **only one per screen** – overused yellow stops being a signal.
- Never combine yellow text on a cyan background or vice versa (unreadable).
- Always accompany a color accent with **text or an icon**, not just color.

### 4.2 Typography

| Role | Font | Weight |
|---|---|---|
| Display / headings | **Rajdhani** | 600, 700 |
| Alternative for large titles | **Orbitron** | 700, 800 |
| Body text | **Chakra Petch** | 400, 500 |
| Mono / HUD / numbers | **JetBrains Mono** | 400 |

- All fonts are from Google Fonts, but **self-hosted** via `@fontsource`
  – no calls to a third-party domain (GDPR) and no layout shift.
- Headings: uppercase, `letter-spacing: 0.04em`–`0.1em`.
- Body text: **never uppercase**, `line-height: 1.7`, max. `70ch` per line.
- Scale (mobile → desktop, `clamp()`):
  `h1 2.5→5rem`, `h2 1.75→3rem`, `h3 1.25→1.75rem`, `body 1→1.0625rem`,
  `mono label 0.75rem`.

### 4.3 Shapes and grid

- **Beveled corners instead of rounded ones** – `clip-path: polygon(...)` cuts off
  1–2 corners at 45°. This is the strongest shape signature of the style.
- Borders `1px solid var(--cp-line)`, active state `1px solid var(--cp-yellow)`.
- Grid: 12 columns, max. content width `1200px`, gutter `24px`
  (mobile `16px` – never less).
- Spacing: multiples of `8px`; between sections `96px` on mobile, `160px` on desktop.

### 4.4 Neon glow

```css
.neon-yellow {
  box-shadow:
    0 0 0 1px var(--cp-yellow),
    0 0 24px -6px color-mix(in srgb, var(--cp-yellow) 70%, transparent);
}
```

The glow is **subtle** – it serves to highlight an interactive element, not as
decoration for everything.

---

## 5. Effects and animations

| Effect | Where | How |
|---|---|---|
| **Glitch heading** | Hero, section headings | Two `::before`/`::after` copies of the text in cyan and magenta, offset by 2–3 px, animated via `clip-path`. Triggered once on display, not in a loop. |
| **Scanlines** | Hero, images | `repeating-linear-gradient` overlay, `opacity: 0.05`, `pointer-events: none` |
| **Noise / CRT** | Background | SVG `feTurbulence` as a `data:` URI, `opacity: 0.03` |
| **Typewriter** | Hero, form states | Characters typed out progressively with a blinking cursor `▌` |
| **Section reveal** | All sections | `IntersectionObserver` → shift up from 24 px below + fade, `240 ms` |
| **Filling timeline** | Development section | The line between steps is drawn according to the scroll position |
| **Hover glitch** | Menu, buttons | Short shift `±2 px` + recoloring, `120 ms` |
| **Counters** | About me section | Numbers count up from zero on display |

**Rules:**
- No animation runs in a loop outside the viewport (saves battery).
- Transitions `120–320 ms`, `cubic-bezier(0.2, 0, 0, 1)`.
- `@media (prefers-reduced-motion: reduce)` turns off glitch, scanlines,
  typewriter and the filling timeline – content is displayed immediately.

---

## 6. Images and media

### What is needed

| Asset | Description | Format |
|---|---|---|
| Hero background | Dark neon city / abstract tech scene | AVIF + WebP, 1920×1080 and 960×540 |
| Portrait | Photo with a duotone filter (yellow/cyan) | AVIF + WebP, square 800×800 |
| Project previews | Screenshots of IziWeddy / IziBudgy in a phone frame | AVIF + WebP, 1200×800 |
| Service icons | Thin line icons, `currentColor` | inline SVG |
| Logo | Monogram `LF` in an angular style | inline SVG |
| Favicon | From the logo | SVG + PNG 180×180 |
| Textures | Noise, scanlines, hex grid | inline SVG / CSS gradients |

### Rules

- **Do not use official assets of the game Cyberpunk 2077** – the logo, the font *Refrigerator
  Deluxe*, screenshots or characters. They are protected (CD Projekt). We draw inspiration from
  the style, we do not copy property.
- **Client logos** may only be used to the extent permitted by the contract – see
  the warning in [section 3.2](#32-about-me).
- Always `<picture>` with AVIF → WebP → JPEG and explicit `width`/`height`
  (no layout shift).
- Everything except the hero image `loading="lazy"` + `decoding="async"`.
- Duotone is done **in CSS** (`filter` + `mix-blend-mode`), not baked into the file –
  that way it can be changed without re-exporting.
- Decorative images `alt=""`, content images with a description.

---

## 7. Components

Portal-specific components live in `apps/portal/src/components`, generic ones
(button, field, dialog) in `packages/ui`.

| Component | Description |
|---|---|
| `GlitchHeading` | Heading with a glitch effect, prop `level` |
| `NeonPanel` | Panel with beveled corners and an optional glow |
| `HudFrame` | HUD corner marks around content |
| `SectionLabel` | Mono label `// SEKCE 01` (// SECTION 01) |
| `TypewriterText` | Progressively typed-out text |
| `CyberButton` | Button, variants `primary` / `ghost` |
| `StatCounter` | Number with a count-up and a caption |
| `ServiceCard` | Service card |
| `ProcessTimeline` | Timeline of development steps – vertical on mobile, horizontal on desktop |
| `ProcessStep` | A single timeline step (number, title, description, output) |
| `ProjectCard` | Large product card with a status badge |
| `BrandStrip` | Strip of brand logos |
| `ContactForm` | Contact form with validation and states |
| `SiteNav` | Top bar including the mobile overlay |
| `SiteFooter` | Footer |
| `TestimonialCard` | *(later – once there are references)* |

Section texts are not hardcoded in the components but in `apps/portal/src/content/*.ts` –
they can be edited without touching the layout and translated later.

---

## 8. Accessibility

A dark neon theme easily slips into unreadability. Therefore:

- Body text contrast **min. 4.5:1**, large headings **3:1**.
  `--cp-muted` on `--cp-panel` meets 4.5:1 – do not use a darker gray.
- A visible `:focus-visible` state – a yellow `2px` outline with a `2px` offset.
  Never `outline: none` without a replacement.
- Touch targets **min. 44 × 44 px**.
- Semantic HTML – `<nav>`, `<main>`, `<section>` with `aria-labelledby`.
  Development steps as an `<ol>`, not as a jumble of `<div>`s.
- A "Přeskočit na obsah" (Skip to content) link as the first element in the tab order.
- Form: a `<label>` for every field, errors conveyed by text as well as color, `aria-describedby`.
- `prefers-reduced-motion` turns off motion (see [section 5](#5-effects-and-animations)).
- The website must be fully operable by keyboard, including the mobile menu.

---

## 9. Performance and SEO

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 90 (mobile) |
| LCP | < 2.5 s |
| CLS | < 0.1 |
| JS bundle (gzip) | < 150 kB |

- Fonts self-hosted, `font-display: swap`, only the display weight preloaded.
- Hero image `fetchpriority="high"`, the rest lazy.
- Effects purely in CSS – no animation library just for the glitch.
- SEO: unique `<title>` and `description`, Open Graph and Twitter cards,
  `JSON-LD` schema `Person` + `ProfessionalService`, `sitemap.xml`, `robots.txt`,
  canonical URL `https://www.fridrich.cloud/`.
- The website runs without third-party cookies; analytics without personal data
  (see [open question #2](#11-open-questions)).

---

## 10. Application structure

```
apps/portal/
├── public/
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── assets/
│   │   ├── images/            # hero, portrait, project previews
│   │   └── icons/             # service SVG icons, brand logos, logo
│   ├── components/            # GlitchHeading, NeonPanel, CyberButton, …
│   ├── sections/              # HeroSection, AboutSection, ServicesSection,
│   │                          # ProcessSection, ProjectsSection, ContactSection
│   ├── content/               # about.ts, services.ts, process.ts, projects.ts
│   ├── composables/           # useReveal, useTypewriter, useActiveSection
│   ├── router/
│   ├── views/                 # HomeView, ProjectView, LoginView, RegisterView
│   ├── App.vue
│   ├── main.ts
│   └── style.css              # import @fridrich/design + portal styles
├── index.html
├── staticwebapp.config.json
└── vite.config.ts
```

Technologies: **Vue 3** (`<script setup lang="ts">`), **Vite**, **TypeScript**,
**Vue Router**. Pinia only where there is truly shared state (the logged-in user).
Styles in plain CSS with variables from `@fridrich/design` – no utility framework,
because the beveled shapes and glitch layers are written by hand anyway.

---

## 11. Open questions

| # | Question | Proposal |
|---|---|---|
| 1 | Analytics? | Cookieless – Azure Application Insights or Plausible |
| 2 | Blog / articles? | Not for now; if yes, a menu item and the route `/blog` will be added |
| 3 | Contact form – where does the message go? | To e-mail via Azure Communication Services + a copy in Cosmos DB |
| 4 | Portrait photo and IČO for the footer? | I need to supply them |

### Answered

| Question | Decision |
|---|---|
| Menu: *Vývoj* or *Projekty*? | **Both.** *Vývoj* describes the collaboration process, *Projekty* my own products. |
| References | Not being addressed for now, the section is not displayed. |
| Texts about me | 10 years of experience, full stack, projects for large international companies + smaller custom development. |
| Client names on the website | **Do not mention.** The website mentions only industries – no names, logos or identifiable case studies. |
