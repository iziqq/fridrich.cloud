# 🌃 Portál `www.fridrich.cloud`

Prezentační web Libora Fridricha – **vývoj na míru**. Cílem je získat poptávky:
návštěvník musí do pár vteřin pochopit, co dělám, komu jsem to dělal a jak
spolupráce probíhá. Zároveň je to vstupní brána k vlastním produktům
(IziWeddy, IziBudgy).

Vizuální styl: **Cyberpunk 2077** – tmavý podklad, signální žlutá, neonová
azurová, hranatá technická typografie, glitch efekty a HUD prvky.

---

## Obsah

1. [Cíle a cílová skupina](#1-cíle-a-cílová-skupina)
2. [Navigace](#2-navigace)
3. [Sekce stránky](#3-sekce-stránky)
4. [Design systém](#4-design-systém)
5. [Efekty a animace](#5-efekty-a-animace)
6. [Obrázky a média](#6-obrázky-a-média)
7. [Komponenty](#7-komponenty)
8. [Přístupnost](#8-přístupnost)
9. [Výkon a SEO](#9-výkon-a-seo)
10. [Struktura aplikace](#10-struktura-aplikace)
11. [Otevřené otázky](#11-otevřené-otázky)

---

## 1. Cíle a cílová skupina

| | |
|---|---|
| **Hlavní cíl** | Poptávka přes kontaktní formulář |
| **Vedlejší cíle** | Ukázat zkušenost z velkých firem a vlastní produkty jako důkaz schopností; vysvětlit, jak spolupráce probíhá |
| **Cílová skupina** | Firmy a podnikatelé hledající vývoj webových a cloudových aplikací na míru |
| **Tón** | Sebejistý, technický, konkrétní. Žádné prázdné marketingové fráze. |
| **Zařízení** | Mobile-first, ale desktop je pro tuhle cílovku stejně důležitý |

---

## 2. Navigace

Sticky „pill" lišta plovoucí nad obsahem – tmavý panel se zaoblenými konci,
tenkým světlým okrajem a jemným stínem.

```
┌────────────────────────────────────────────────────────────────────┐
│  ⟨logo⟩   O MNĚ   SLUŽBY   VÝVOJ   PROJEKTY   KONTAKT │ PŘIHLÁSIT SE │
└────────────────────────────────────────────────────────────────────┘
```

| Položka | Cíl |
|---|---|
| **O mně** | `/#o-mne` |
| **Služby** | `/#sluzby` |
| **Vývoj** | `/#vyvoj` – jak spolupráce probíhá krok po kroku |
| **Projekty** | `/#projekty` |
| **Kontakt** | `/#kontakt` |
| *(oddělovač)* | svislá linka `--cp-line` |
| **Přihlásit se** | `/prihlaseni` |

> **Reference** v menu zatím nejsou. Až budou k dispozici citace klientů,
> položka se vloží mezi *Vývoj* a *Projekty* – sekce i komponenta jsou na to
> v [kap. 3.6](#36-reference-později) připravené.

### Chování

- Položky jsou **verzálkami**, `letter-spacing: 0.08em`, font Rajdhani 600.
- **Aktivní sekce** se zvýrazní signální žlutou (`--cp-yellow`) – sleduje se
  `IntersectionObserver`em, ne jen kliknutím.
- **Hover:** krátký glitch posun (±2 px) + přebarvení na žlutou.
- **Přihlásit se** je vizuálně oddělené – světlejší text, po přihlášení se mění
  na jméno uživatele s rozbalovací nabídkou (*Můj účet*, *IziWeddy*, *Odhlásit*).
- **Mobil (< 768 px):** logo + ikona menu; po otevření **fullscreen overlay**
  s položkami pod sebou, animovaný jako „boot sekvence" terminálu.
- Lišta se při scrollu dolů skryje a při scrollu nahoru vrátí.

---

## 3. Sekce stránky

### 3.1 Hero

Úvodní obrazovka na celou výšku viewportu.

- **Nadnadpis** (mono, azurová): `// FRIDRICH.CLOUD`
- **Nadpis (glitch):** `LIBOR FRIDRICH`
- **Podnadpis:** `VÝVOJ NA MÍRU`
- **Perex:** `10 let full stack vývoje. Weby a aplikace na míru – od analýzy po produkci.`
- **CTA:** primární `MÁM PROJEKT` (→ kontakt), sekundární `JAK PRACUJI` (→ vývoj).
- **Pozadí:** tmavý neonový snímek města s duotone gradientem, přes něj scanlines
  a šum; dole plynulý přechod do barvy podkladu.
- **HUD dekorace:** rohové značky, vlevo dole „typewriter" výpis technologií
  (`Vue 3 · TypeScript · .NET · Azure · Cosmos DB`).

### 3.2 O mně

Portrét s duotone filtrem (žlutá/azurová) a zkosenými rohy, vedle text v první
osobě.

**Obsah textu:**

- **10 let praxe** ve full stack vývoji – frontend, backend i databáze.
- Vývoj pro **velké mezinárodní firmy** napříč odvětvími. Část zakázek vedená
  přímo, část pod dodavatelskými firmami.
- Vedle korporátních projektů i **menší vývoj na míru** – tam, kde si zákazník
  potřebuje sednout s člověkem, který to i naprogramuje.

> ⚠️ **Jména klientů se na web nepíšou.** Rozhodnutí zadavatele: konkrétní
> značky se neuvádějí, aby nebylo co řešit se smluvními omezeními. Místo nich
> se zmiňují jen **odvětví**. Tohle pravidlo platí i pro budoucí texty, loga,
> případové studie i screenshoty – nic, z čeho by šlo klienta identifikovat.

**Stat pruh** – velká čísla v mono fontu s neonovým svitem:

| Číslo | Popisek |
|---|---|
| `10+` | let praxe |
| `4` | odvětví |
| `FULL STACK` | frontend · backend · cloud |

**Pruh odvětví** pod textem – jednobarevně (`--cp-muted`), na hoveru zesvětlí,
nad ním mono popisek `// ODVĚTVÍ, VE KTERÝCH JSEM PRACOVAL`:
průmyslová výroba, automotive, spotřební zboží, zakázkový vývoj.

### 3.3 Služby

Mřížka karet (1 sloupec mobil / 2 tablet / 3 desktop). Karta = ikona, název,
dvě až tři věty, výčet klíčových technologií.

| Služba | Obsah |
|---|---|
| **Webové aplikace na míru** | Návrh a vývoj od nuly – frontend, backend, databáze |
| **Cloudová řešení (Azure)** | Architektura, nasazení, provoz, optimalizace nákladů |
| **Integrace a automatizace** | Propojení systémů, API, datové toky, náhrada ruční práce |
| **Konzultace a code review** | Posouzení architektury, technický audit, doprovod týmu |

Karta má zkosený levý horní roh a při hoveru se rozsvítí neonový rámeček.

### 3.4 Vývoj – jak to probíhá

**Klíčová sekce webu.** Zákazník, který zvažuje vývoj na míru, se nejvíc bojí,
že neví, do čeho jde. Tahle sekce mu ukáže celý postup dopředu.

Šest kroků, každý s pořadovým číslem v mono fontu (`01`–`06`), názvem, dvěma
až třemi větami a výstupem, který z kroku vzejde:

| # | Krok | Co se děje | Výstup |
|---|---|---|---|
| `01` | **Úvodní schůzka** | Sejdeme se a projdeme, co potřebujete a proč. Ptám se hlavně na to, co má výsledek vyřešit, ne na to, jak má vypadat. | Zápis ze schůzky |
| `02` | **Potvrzení zadání** | Sepíšu požadavky vlastními slovy a potvrdíme si, že jsme se pochopili stejně. | Odsouhlasené zadání |
| `03` | **Analýza** | Ověřím, že zadání dává technicky i ekonomicky smysl, a navrhnu řešení, rozsah, cenu a termín. | Návrh řešení, cena, termín |
| `04` | **Demo** | Postavím **mocknuté demo** – proklikatelné, ale zatím bez ostré logiky. Na něm si odsouhlasíme vzhled a toky **dřív, než se napíše drahý kód**. | Proklikatelné demo |
| `05` | **Hlavní vývoj** | Vzniká ostrá aplikace. Průběžně ji nasazuji na testovací prostředí, kde si ji **testujete ještě před spuštěním**. | Odladěná aplikace na testu |
| `06` | **Produkce** | Nasazení do ostrého provozu, předání a další podpora. | Běžící aplikace |

**Proč právě takhle** – krátký odstavec pod kroky: díky demu ve čtvrtém kroku se
změny vzhledu a toků řeší tam, kde jsou levné. Do ostrého vývoje jdeme až s tím,
co je odsouhlasené.

**Vzhled:**
- **Mobil:** svislá časová osa – vlevo neonová linka, na ní číslované uzly,
  vpravo obsah kroku.
- **Desktop:** vodorovný HUD stepper, kroky spojené linkou se šipkami.
- Aktuálně zobrazený krok se při scrollu rozsvítí žlutě, ostatní zůstávají
  v `--cp-muted` – linka „nabíhá" jako progres.
- Čísla kroků v `JetBrains Mono` s jemným svitem.
- Sekci uzavírá CTA `ZAČNEME PRVNÍM KROKEM` → kontakt.

### 3.5 Projekty

Vlastní produkty jako důkaz schopností. Velké karty přes celou šířku.

| Projekt | Stav | Popis | Odkaz |
|---|---|---|---|
| **IziWeddy** | Ve vývoji | Svatební plánovač – hosté, přípravy, rozpočet na jednom místě | `/projekty/iziweddy` → `iziweddy.fridrich.cloud` |
| **IziBudgy** | Připravujeme | Rozpočet domácnosti – přehled příjmů, výdajů a úspor | `/projekty/izibudgy` |

Karta obsahuje: náhled aplikace, název, stavový štítek, popis, použité
technologie a tlačítko. Štítek stavu je barevný **i textový**
(`VE VÝVOJI` žlutá, `PŘIPRAVUJEME` azurová, `SPUŠTĚNO` zelená).

### 3.6 Reference *(později)*

Zatím se nezobrazuje – nemám reálné citace klientů a smyšlené tam nepatří.

Až budou, sekce se zapne mezi *Vývoj* a *Projekty*: karusel citací (text, jméno,
pozice, firma, případně logo), nad citací mono popisek `// KLIENT 01`.
Komponenta `TestimonialCard` a položka menu se přidají zároveň.

### 3.7 Kontakt

- Formulář: **Jméno**, **E-mail**, **Zpráva** (+ skrytý honeypot proti robotům).
- Vedle formuláře přímé kontakty – e-mail, LinkedIn, GitHub.
- Odesílá se `POST /api/contact`; stavy *odesílám → odesláno → chyba* se
  vypisují jako řádky terminálu.
- Souhlas se zpracováním osobních údajů s odkazem na zásady.

### 3.8 Patička

Logo, `© 2026 Libor Fridrich`, IČO, odkaz na zásady ochrany osobních údajů,
odkaz na produkty. Nad patičkou tenká neonová linka.

---

## 4. Design systém

Tokeny žijí v `packages/design` jako CSS proměnné, aby je mohly převzít
i produktové aplikace.

### 4.1 Barvy

| Token | Hodnota | Použití |
|---|---|---|
| `--cp-black` | `#050506` | Podklad stránky |
| `--cp-panel` | `#0E0E11` | Karty, panely, lišta |
| `--cp-line` | `#1F1F25` | Okraje, oddělovače, mřížka |
| `--cp-yellow` | `#FCEE0A` | **Signální barva** – CTA, aktivní stav, důrazy |
| `--cp-cyan` | `#00F0FF` | Sekundární akcent – popisky, odkazy, HUD |
| `--cp-magenta` | `#FF003C` | Chyby, výstrahy, glitch vrstva |
| `--cp-green` | `#39FF7A` | Úspěch, stav „spuštěno" |
| `--cp-text` | `#E8E8EA` | Běžný text |
| `--cp-muted` | `#8A8A93` | Sekundární text, popisky |

**Pravidla:**
- Žlutá je **jen jedna na obrazovku** – přeplácaná žlutá přestane být signál.
- Nikdy nekombinovat žlutý text na azurovém podkladu a naopak (nečitelné).
- Barevný akcent vždy doprovodit **textem nebo ikonou**, ne jen barvou.

### 4.2 Typografie

| Role | Font | Řez |
|---|---|---|
| Displej / nadpisy | **Rajdhani** | 600, 700 |
| Alternativa pro velké titulky | **Orbitron** | 700, 800 |
| Běžný text | **Chakra Petch** | 400, 500 |
| Mono / HUD / čísla | **JetBrains Mono** | 400 |

- Všechny fonty jsou z Google Fonts, ale **self-hostované** přes `@fontsource`
  – bez volání na cizí doménu (GDPR) a bez skoku layoutu.
- Nadpisy: verzálky, `letter-spacing: 0.04em`–`0.1em`.
- Běžný text: **nikdy verzálkami**, `line-height: 1.7`, max. `70ch` na řádek.
- Škála (mobil → desktop, `clamp()`):
  `h1 2.5→5rem`, `h2 1.75→3rem`, `h3 1.25→1.75rem`, `body 1→1.0625rem`,
  `mono popisek 0.75rem`.

### 4.3 Tvary a mřížka

- **Zkosené rohy místo zaoblených** – `clip-path: polygon(...)` odřízne
  1–2 rohy pod 45°. To je nejsilnější tvarový podpis stylu.
- Rámečky `1px solid var(--cp-line)`, aktivní stav `1px solid var(--cp-yellow)`.
- Mřížka: 12 sloupců, max. šířka obsahu `1200px`, gutter `24px`
  (mobil `16px` – nikdy méně).
- Rozestupy: násobky `8px`; mezi sekcemi `96px` na mobilu, `160px` na desktopu.

### 4.4 Neonový svit

```css
.neon-yellow {
  box-shadow:
    0 0 0 1px var(--cp-yellow),
    0 0 24px -6px color-mix(in srgb, var(--cp-yellow) 70%, transparent);
}
```

Svit je **decentní** – slouží ke zvýraznění interaktivního prvku, ne jako
dekorace všeho.

---

## 5. Efekty a animace

| Efekt | Kde | Jak |
|---|---|---|
| **Glitch nadpis** | Hero, nadpisy sekcí | Dvě `::before`/`::after` kopie textu v azurové a magentě, posunuté o 2–3 px, animované přes `clip-path`. Spouští se jednou při zobrazení, ne ve smyčce. |
| **Scanlines** | Hero, obrázky | `repeating-linear-gradient` overlay, `opacity: 0.05`, `pointer-events: none` |
| **Šum / CRT** | Pozadí | SVG `feTurbulence` jako `data:` URI, `opacity: 0.03` |
| **Typewriter** | Hero, stavy formuláře | Postupné vypisování znaků s blikajícím kurzorem `▌` |
| **Odhalení sekce** | Všechny sekce | `IntersectionObserver` → posun zdola o 24 px + fade, `240 ms` |
| **Nabíhající osa** | Sekce Vývoj | Linka mezi kroky se vykresluje podle pozice scrollu |
| **Hover glitch** | Menu, tlačítka | Krátký posun `±2 px` + přebarvení, `120 ms` |
| **Počítadla** | Sekce O mně | Odpočet čísel od nuly při zobrazení |

**Pravidla:**
- Žádná animace neběží ve smyčce mimo viewport (šetří baterii).
- Přechody `120–320 ms`, `cubic-bezier(0.2, 0, 0, 1)`.
- `@media (prefers-reduced-motion: reduce)` vypíná glitch, scanlines,
  typewriter i nabíhající osu – obsah se zobrazí rovnou.

---

## 6. Obrázky a média

### Co je potřeba

| Asset | Popis | Formát |
|---|---|---|
| Hero pozadí | Tmavé neonové město / abstraktní tech scéna | AVIF + WebP, 1920×1080 a 960×540 |
| Portrét | Fotka s duotone filtrem (žlutá/azurová) | AVIF + WebP, čtverec 800×800 |
| Náhledy projektů | Snímky obrazovek IziWeddy / IziBudgy v rámečku telefonu | AVIF + WebP, 1200×800 |
| Ikony služeb | Tenké linkové ikony, `currentColor` | inline SVG |
| Logo | Monogram `LF` v hranatém stylu | inline SVG |
| Favicon | Z loga | SVG + PNG 180×180 |
| Textury | Šum, scanlines, hex mřížka | inline SVG / CSS gradienty |

### Pravidla

- **Nepoužívat oficiální assety hry Cyberpunk 2077** – logo, font *Refrigerator
  Deluxe*, screenshoty ani postavy. Jsou chráněné (CD Projekt). Inspirujeme se
  stylem, nekopírujeme majetek.
- **Loga klientů** používat jen v rozsahu, který dovoluje smlouva – viz
  upozornění v [kap. 3.2](#32-o-mně).
- Vždy `<picture>` s AVIF → WebP → JPEG a explicitní `width`/`height`
  (žádný skok layoutu).
- Vše kromě hero obrázku `loading="lazy"` + `decoding="async"`.
- Duotone se dělá **v CSS** (`filter` + `mix-blend-mode`), ne zapečený v souboru –
  jde pak měnit bez přeexportu.
- Dekorativní obrázky `alt=""`, obsahové s popisem.

---

## 7. Komponenty

Komponenty specifické pro portál žijí v `apps/portal/src/components`, obecné
(tlačítko, pole, dialog) v `packages/ui`.

| Komponenta | Popis |
|---|---|
| `GlitchHeading` | Nadpis s glitch efektem, prop `level` |
| `NeonPanel` | Panel se zkosenými rohy a volitelným svitem |
| `HudFrame` | Rohové HUD značky kolem obsahu |
| `SectionLabel` | Mono popisek `// SEKCE 01` |
| `TypewriterText` | Postupně vypisovaný text |
| `CyberButton` | Tlačítko, varianty `primary` / `ghost` |
| `StatCounter` | Číslo s odpočtem a popiskem |
| `ServiceCard` | Karta služby |
| `ProcessTimeline` | Osa kroků vývoje – svislá na mobilu, vodorovná na desktopu |
| `ProcessStep` | Jeden krok osy (číslo, název, popis, výstup) |
| `ProjectCard` | Velká karta produktu se stavovým štítkem |
| `BrandStrip` | Pruh log značek |
| `ContactForm` | Kontaktní formulář s validací a stavy |
| `SiteNav` | Horní lišta včetně mobilního overlaye |
| `SiteFooter` | Patička |
| `TestimonialCard` | *(později – až budou reference)* |

Texty sekcí nejsou natvrdo v komponentách, ale v `apps/portal/src/content/*.ts` –
jde je upravit bez zásahu do rozvržení a později přeložit.

---

## 8. Přístupnost

Tmavé neonové téma snadno sklouzne k nečitelnosti. Proto:

- Kontrast běžného textu **min. 4.5:1**, velkých nadpisů **3:1**.
  `--cp-muted` na `--cp-panel` splňuje 4.5:1 – tmavší šedou už nepoužívat.
- Viditelný stav `:focus-visible` – žlutý obrys `2px` s odsazením `2px`.
  Nikdy `outline: none` bez náhrady.
- Dotykové cíle **min. 44 × 44 px**.
- Sémantické HTML – `<nav>`, `<main>`, `<section>` s `aria-labelledby`.
  Kroky vývoje jako `<ol>`, ne jako změť `<div>`.
- Odkaz „Přeskočit na obsah" jako první prvek v pořadí tabulátoru.
- Formulář: `<label>` u každého pole, chyby textem i barvou, `aria-describedby`.
- `prefers-reduced-motion` vypíná pohyb (viz [kap. 5](#5-efekty-a-animace)).
- Web musí být plně ovladatelný klávesnicí včetně mobilního menu.

---

## 9. Výkon a SEO

| Metrika | Cíl |
|---|---|
| Lighthouse Performance | ≥ 90 (mobil) |
| LCP | < 2,5 s |
| CLS | < 0,1 |
| JS bundle (gzip) | < 150 kB |

- Fonty self-hostované, `font-display: swap`, přednačtený jen displejový řez.
- Hero obrázek `fetchpriority="high"`, zbytek lazy.
- Efekty čistě v CSS – žádná animační knihovna kvůli glitchi.
- SEO: unikátní `<title>` a `description`, Open Graph a Twitter karty,
  `JSON-LD` schéma `Person` + `ProfessionalService`, `sitemap.xml`, `robots.txt`,
  kanonická URL `https://www.fridrich.cloud/`.
- Web běží bez cookies třetích stran; analytika bez osobních údajů
  (viz [otevřená otázka #2](#11-otevřené-otázky)).

---

## 10. Struktura aplikace

```
apps/portal/
├── public/
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── assets/
│   │   ├── images/            # hero, portrét, náhledy projektů
│   │   └── icons/             # SVG ikony služeb, loga značek, logo
│   ├── components/            # GlitchHeading, NeonPanel, CyberButton, …
│   ├── sections/              # HeroSection, AboutSection, ServicesSection,
│   │                          # ProcessSection, ProjectsSection, ContactSection
│   ├── content/               # about.ts, services.ts, process.ts, projects.ts
│   ├── composables/           # useReveal, useTypewriter, useActiveSection
│   ├── router/
│   ├── views/                 # HomeView, ProjectView, LoginView, RegisterView
│   ├── App.vue
│   ├── main.ts
│   └── style.css              # import @fridrich/design + styly portálu
├── index.html
├── staticwebapp.config.json
└── vite.config.ts
```

Technologie: **Vue 3** (`<script setup lang="ts">`), **Vite**, **TypeScript**,
**Vue Router**. Pinia jen tam, kde je opravdu sdílený stav (přihlášený uživatel).
Styly v čistém CSS s proměnnými z `@fridrich/design` – žádný utility framework,
protože zkosené tvary a glitch vrstvy se stejně píšou ručně.

---

## 11. Otevřené otázky

| # | Otázka | Návrh |
|---|---|---|
| 1 | Analytika? | Bez cookies – Azure Application Insights nebo Plausible |
| 2 | Blog / články? | Zatím ne; kdyby ano, přibude položka menu a routa `/blog` |
| 3 | Kontaktní formulář – kam chodí zpráva? | Na e-mail přes Azure Communication Services + kopie do Cosmos DB |
| 4 | Fotka na portrét a IČO do patičky? | Potřebuji dodat |

### Zodpovězeno

| Otázka | Rozhodnutí |
|---|---|
| Menu: *Vývoj*, nebo *Projekty*? | **Obojí.** *Vývoj* popisuje postup spolupráce, *Projekty* vlastní produkty. |
| Reference | Zatím se neřeší, sekce se nezobrazuje. |
| Texty o mně | 10 let praxe, full stack, projekty pro velké mezinárodní firmy + menší vývoj na míru. |
| Jména klientů na webu | **Neuvádět.** Web zmiňuje jen odvětví – žádné názvy, loga ani identifikovatelné případové studie. |
