---
title: Portál www.fridrich.cloud
type: domena
sources:
  - raw/portal-specifikace.md
  - kód: apps/portal/src/{components,sections,content,views}, packages/design
updated: 2026-09-15
---

# Portál `www.fridrich.cloud`

> Prezentační web Libora Fridricha – **vývoj na míru**. Hlavní cíl je
> poptávka přes kontaktní formulář; zároveň vstupní brána k produktům.
> Vizuální styl inspirovaný **Cyberpunk 2077**. Portál není business doména,
> ale obsah a vzhled; jeho jediné volání API je [contact](contact.md)
> a přihlášení ([identity](identity.md)).

Úplné znění specifikace (texty sekcí, efekty, assety) je ve zdroji
[raw/portal-specifikace.md](../../raw/portal-specifikace.md). Tahle stránka
drží pravidla, která musí dodržet každá změna.

## Obsah a navigace

Menu: *O mně · Služby · Vývoj · Projekty · Kontakt · Přihlásit se*
(po přihlášení jméno uživatele → účet). Aktivní sekce se zvýrazní podle
scrollu (`useActiveSection`).

| Sekce | Obsah |
|---|---|
| Hero | `LIBOR FRIDRICH` / `VÝVOJ NA MÍRU`, CTA `MÁM PROJEKT` → kontakt, `JAK PRACUJI` → vývoj |
| O mně | 10+ let full stack, velké mezinárodní firmy i menší vývoj na míru, pruh odvětví |
| Služby | Webové aplikace na míru · Cloud (Azure) · Integrace a automatizace · Konzultace a code review |
| Vývoj | **Klíčová sekce** – 6 kroků: úvodní schůzka → potvrzení zadání → analýza → mocknuté demo → hlavní vývoj s testovacím prostředím → produkce |
| Projekty | IziWeddy (ve vývoji), IziBudgy (připravujeme) |
| Kontakt | Formulář jméno/e-mail/zpráva + honeypot, přímé kontakty |

Texty nejsou v komponentách, ale v `apps/portal/src/content/site.ts`.

## Závazná pravidla

> ⚠️ **Jména klientů se na web nepíšou** – ani loga, případové studie nebo
> screenshoty, ze kterých by šel klient poznat. Zmiňují se jen odvětví
> (průmyslová výroba, automotive, spotřební zboží, zakázkový vývoj).

- **Reference** se nezobrazují, dokud nejsou skutečné citace.
- **Žádné oficiální assety hry** (logo, font Refrigerator Deluxe, screenshoty) –
  inspirace stylem, ne kopie.
- **Signální žlutá jen jednou na obrazovku**; nikdy žlutý text na azurové a naopak;
  barva vždy doprovozená textem nebo ikonou.
- **Běžný text nikdy verzálkami**, `line-height: 1.7`, max. `70ch`.
- **Zkosené rohy místo zaoblených** (`clip-path`), mřížka 12 sloupců, max. šířka `1200px`, gutter 24 px (mobil 16 px).
- **Animace** 120–320 ms, nikdy ve smyčce mimo viewport; `prefers-reduced-motion` vypne glitch, scanlines, typewriter i nabíhající osu.
- **Fonty self-hostované** (`@fontsource`) – žádná volání cizí domény.

## Design tokeny (`packages/design`)

| Token | Hodnota | Použití |
|---|---|---|
| `--cp-black` | `#050506` | podklad |
| `--cp-panel` | `#0E0E11` | karty, panely |
| `--cp-line` | `#1F1F25` | okraje |
| `--cp-yellow` | `#FCEE0A` | signální – CTA, aktivní stav |
| `--cp-cyan` | `#00F0FF` | sekundární akcent, HUD |
| `--cp-magenta` | `#FF003C` | chyby, glitch |
| `--cp-green` | `#39FF7A` | úspěch |
| `--cp-text` | `#E8E8EA` | text |
| `--cp-muted` | `#8A8A93` | sekundární text (tmavší šedou nepoužívat – kontrast) |

Typografie: Rajdhani (nadpisy), Chakra Petch (text), JetBrains Mono (HUD, čísla).

## Přístupnost a výkon

- Kontrast textu min. 4.5:1, nadpisů 3:1; viditelný `:focus-visible` (žlutý obrys 2 px).
- Dotykové cíle min. 44 × 44 px; skip link „Přeskočit na obsah"; formulář s `<label>` a `aria-describedby`.
- Cíle: Lighthouse mobil ≥ 90, LCP < 2,5 s, CLS < 0,1, JS gzip < 150 kB.
- SEO: unikátní title/description, Open Graph, JSON-LD `Person` + `ProfessionalService`, `sitemap.xml`, `robots.txt`.

## Otevřené body

Analytika bez cookies, blog, fotka na portrét a IČO do patičky – viz
[rozhodnuti.md](../rozhodnuti.md#otevřené-otázky).

## Související

- [Frontend](../architektura/frontend.md) · [contact](contact.md)
