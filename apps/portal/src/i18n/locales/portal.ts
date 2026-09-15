import type { Catalog } from '@fridrich/shared';

/*
 * Jmenný prostor `portal` – prezentační web: navigace, sekce domovské stránky,
 * detail projektu, patička a obal právních dokumentů.
 *
 * Klíče položek (`services.items.webApps`, `process.steps.demo`) odpovídají
 * `id` ve `content/site.ts` – struktura žije tam, texty tady.
 * Text právních dokumentů (`content/legal.ts`) je jen česky a sem nepatří.
 */

export const portalCs = {
  site: {
    tagline: 'Vývoj na míru',
  },
  nav: {
    label: 'Hlavní navigace',
    home: 'Domů',
    login: 'Přihlásit se',
    openMenu: 'Otevřít menu',
    closeMenu: 'Zavřít menu',
    items: {
      about: 'O mně',
      services: 'Služby',
      process: 'Vývoj',
      projects: 'Projekty',
      contact: 'Kontakt',
    },
  },
  hero: {
    subtitle: 'Vývoj na míru',
    lead: '10 let full stack vývoje. Weby a aplikace na míru – od první schůzky až po produkci.',
    primaryAction: 'Mám projekt',
    secondaryAction: 'Jak pracuji',
    stackLabel: 'Technologie',
  },
  about: {
    label: '// 01 — O MNĚ',
    title: 'Deset let u toho, co běží v produkci',
    paragraphs: [
      'Jsem full stack vývojář. Píšu frontend, backend i databázovou vrstvu – nepředávám práci na půl cesty a nečekám, až ji někdo dokončí za mě.',
      'Deset let dělám software pro velké mezinárodní firmy – průmyslovou výrobu, automotive i spotřební zboží. Část zakázek jsem vedl přímo, část pod dodavatelskými firmami. Je to prostředí, kde kód musí vydržet roky a kde chyba stojí peníze.',
      'Vedle korporátních zakázek dělám i menší vývoj na míru. Tam si zákazník sedne rovnou s člověkem, který jeho aplikaci i naprogramuje – žádný řetěz manažerů mezi zadáním a kódem.',
    ],
    stats: {
      experience: 'let praxe',
      sectors: 'odvětví',
      fullStack: 'frontend · backend · cloud',
    },
    sectorsLabel: '// Odvětví, ve kterých jsem pracoval',
    sectors: {
      manufacturing: 'Průmyslová výroba',
      automotive: 'Automotive',
      consumerGoods: 'Spotřební zboží',
      customDevelopment: 'Zakázkový vývoj',
    },
  },
  services: {
    label: '// 02 — SLUŽBY',
    title: 'Co pro vás udělám',
    items: {
      webApps: {
        title: 'Webové aplikace na míru',
        description:
          'Návrh a vývoj od nuly. Frontend, backend i databáze – jedna aplikace, jeden člověk, který za ni ručí.',
      },
      cloud: {
        title: 'Cloudová řešení (Azure)',
        description:
          'Architektura, nasazení a provoz v Azure. Včetně toho, aby účet za cloud nerostl rychleji než aplikace.',
      },
      integrations: {
        title: 'Integrace a automatizace',
        description:
          'Propojení systémů, které spolu zatím nemluví. API, datové toky a náhrada ruční práce, která vás zdržuje.',
      },
      consulting: {
        title: 'Konzultace a code review',
        description:
          'Posouzení architektury, technický audit nebo doprovod vašeho týmu. Řeknu i to, co nechcete slyšet.',
      },
    },
    topics: {
      webhooks: 'Webhooky',
      architecture: 'Architektura',
      audit: 'Audit',
    },
  },
  process: {
    label: '// 03 — VÝVOJ',
    title: 'Jak spolupráce probíhá',
    lead: 'Šest kroků. Víte dopředu, co se bude dít a co z každého kroku vzejde.',
    outputLabel: 'Výstup:',
    steps: {
      meeting: {
        title: 'Úvodní schůzka',
        description:
          'Sejdeme se a projdeme, co potřebujete a proč. Ptám se hlavně na to, co má výsledek vyřešit – ne na to, jak má vypadat.',
        output: 'Zápis ze schůzky',
      },
      brief: {
        title: 'Potvrzení zadání',
        description:
          'Sepíšu požadavky vlastními slovy a potvrdíme si, že jsme se pochopili stejně. Tady se odhalí většina nedorozumění.',
        output: 'Odsouhlasené zadání',
      },
      analysis: {
        title: 'Analýza',
        description:
          'Ověřím, že zadání dává technicky i ekonomicky smysl. Navrhnu řešení, rozsah, cenu a termín.',
        output: 'Návrh řešení, cena, termín',
      },
      demo: {
        title: 'Demo',
        description:
          'Postavím proklikatelné demo s nasimulovanými daty. Vzhled a postupy si odsouhlasíme na něm – dřív, než se napíše drahý kód.',
        output: 'Proklikatelné demo',
      },
      development: {
        title: 'Hlavní vývoj',
        description:
          'Vzniká ostrá aplikace. Průběžně ji nasazuji na testovací prostředí, kde si ji otestujete ještě před spuštěním.',
        output: 'Odladěná aplikace na testu',
      },
      production: {
        title: 'Produkce',
        description:
          'Nasazení do ostrého provozu, předání a další podpora. Aplikace vám nezůstane v ruce bez pomoci.',
        output: 'Běžící aplikace',
      },
    },
    note: 'Díky demu ve čtvrtém kroku se změny vzhledu a postupů řeší tam, kde jsou levné. Do ostrého vývoje jdeme až s tím, co je odsouhlasené.',
    cta: 'Začneme prvním krokem',
  },
  projects: {
    label: '// 04 — PROJEKTY',
    title: 'Vlastní produkty',
    lead: 'Aplikace, které stavím pod značkou fridrich.cloud.',
    detail: 'Detail projektu',
    openApp: 'Otevřít aplikaci',
    openAppExternal: 'Otevřít aplikaci ↗',
    backToProjects: '← Zpět na projekty',
    notFound: 'Projekt nenalezen',
    status: {
      development: 'Ve vývoji',
      planned: 'Připravujeme',
      live: 'V provozu',
    },
    items: {
      iziweddy: {
        tagline: 'Svatební plánovač',
        description:
          'Hosté, přípravy a rozpočet na jednom místě. Sledujte, kdo potvrdil účast, co je ještě potřeba zařídit a kolik to celé stojí.',
      },
      izibudgy: {
        tagline: 'Rozpočet domácnosti',
        description:
          'Přehled příjmů, výdajů a úspor. Kam peníze tečou a kolik zbývá do konce měsíce – bez tabulek v Excelu.',
      },
    },
  },
  contact: {
    label: '// 05 — KONTAKT',
    title: 'Máte projekt?',
    lead: 'Napište mi, co potřebujete vyřešit. Ozvu se a domluvíme si první schůzku.',
    directHeading: '// Přímý kontakt',
    writeEmail: 'Napsat e-mail',
    form: {
      name: 'Jméno',
      email: 'E-mail',
      message: 'Zpráva',
      website: 'Webová stránka',
      submit: 'Odeslat',
      submitting: 'Odesílám…',
    },
    status: {
      sending: '> odesílám zprávu…',
      sent: '> odesláno. Ozvu se co nejdřív.',
      error: '> odeslání se nepodařilo. Zkuste to prosím znovu nebo napište přímo na e-mail.',
    },
    consent: {
      text: 'Údaje použiji jen k odpovědi na vaši poptávku a zprávu smažu nejpozději po roce. Více v {link}.',
      link: 'zásadách ochrany osobních údajů',
    },
  },
  footer: {
    productsLabel: 'Produkty',
    productsHeading: '// Produkty',
    contactHeading: '// Kontakt',
    privacy: 'Ochrana osobních údajů',
    terms: 'Obchodní podmínky',
    identification: '© {year} {name} · IČO {ico} · {address}',
  },
  notFound: {
    label: '// Chyba 404',
    title: 'Stránka nenalezena',
    lead: '> požadovaná adresa neexistuje',
    back: '← Zpět na úvod',
  },
  legal: {
    effectiveFrom: 'Účinné od {date}',
    tocLabel: 'Obsah dokumentu',
    tocTitle: '// Obsah',
    privacy: 'Zásady ochrany osobních údajů',
    terms: 'Obchodní podmínky',
    back: '← Zpět na web',
    // Česká verze upozornění se nezobrazuje (dokument je česky), klíč drží jen shodu katalogů.
    czechOnly: 'Tento dokument je k dispozici jen v češtině. Právně závazná je česká verze.',
  },
};

export const portalEn: Catalog<typeof portalCs> = {
  site: {
    tagline: 'Custom development',
  },
  nav: {
    label: 'Main navigation',
    home: 'Home',
    login: 'Sign in',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    items: {
      about: 'About',
      services: 'Services',
      process: 'Process',
      projects: 'Projects',
      contact: 'Contact',
    },
  },
  hero: {
    subtitle: 'Custom development',
    lead: '10 years of full stack development. Custom websites and applications – from the first meeting all the way to production.',
    primaryAction: 'I have a project',
    secondaryAction: 'How I work',
    stackLabel: 'Technologies',
  },
  about: {
    label: '// 01 — ABOUT',
    title: 'Ten years of building what runs in production',
    paragraphs: [
      'I am a full stack developer. I write the frontend, the backend and the database layer – I don’t hand over half-finished work and wait for someone else to complete it.',
      'For ten years I have been building software for large international companies – industrial manufacturing, automotive and consumer goods. Some projects I led directly, others through contracting firms. It is an environment where code has to last for years and where mistakes cost money.',
      'Alongside corporate projects, I also take on smaller custom development. There the client sits down directly with the person who actually builds their application – no chain of managers between the requirements and the code.',
    ],
    stats: {
      experience: 'years of experience',
      sectors: 'industries',
      fullStack: 'frontend · backend · cloud',
    },
    sectorsLabel: '// Industries I have worked in',
    sectors: {
      manufacturing: 'Industrial manufacturing',
      automotive: 'Automotive',
      consumerGoods: 'Consumer goods',
      customDevelopment: 'Custom development',
    },
  },
  services: {
    label: '// 02 — SERVICES',
    title: 'What I can do for you',
    items: {
      webApps: {
        title: 'Custom web applications',
        description:
          'Design and development from scratch. Frontend, backend and database – one application, one person accountable for it.',
      },
      cloud: {
        title: 'Cloud solutions (Azure)',
        description:
          'Architecture, deployment and operations in Azure. Including making sure your cloud bill doesn’t grow faster than your application.',
      },
      integrations: {
        title: 'Integrations and automation',
        description:
          'Connecting systems that don’t talk to each other yet. APIs, data flows and replacing the manual work that slows you down.',
      },
      consulting: {
        title: 'Consulting and code review',
        description:
          'Architecture assessment, technical audit or support for your team. I will tell you even what you don’t want to hear.',
      },
    },
    topics: {
      webhooks: 'Webhooks',
      architecture: 'Architecture',
      audit: 'Audit',
    },
  },
  process: {
    label: '// 03 — PROCESS',
    title: 'How we work together',
    lead: 'Six steps. You know in advance what will happen and what each step delivers.',
    outputLabel: 'Output:',
    steps: {
      meeting: {
        title: 'Kick-off meeting',
        description:
          'We meet and go through what you need and why. I mostly ask what the result should solve – not what it should look like.',
        output: 'Meeting notes',
      },
      brief: {
        title: 'Requirements confirmation',
        description:
          'I write down the requirements in my own words and we confirm we understand them the same way. This is where most misunderstandings surface.',
        output: 'Approved requirements',
      },
      analysis: {
        title: 'Analysis',
        description:
          'I verify that the requirements make sense both technically and economically. I propose a solution, scope, price and deadline.',
        output: 'Solution proposal, price, deadline',
      },
      demo: {
        title: 'Demo',
        description:
          'I build a clickable demo with simulated data. We agree on the look and workflows using it – before any expensive code gets written.',
        output: 'Clickable demo',
      },
      development: {
        title: 'Main development',
        description:
          'The real application takes shape. I continuously deploy it to a test environment, where you can try it out before launch.',
        output: 'Tested application in staging',
      },
      production: {
        title: 'Production',
        description:
          'Go-live, handover and ongoing support. You won’t be left alone with the application.',
        output: 'Running application',
      },
    },
    note: 'Thanks to the demo in step four, changes to the look and workflows are made where they are cheap. We start the real development only with what has been approved.',
    cta: 'Let’s start with step one',
  },
  projects: {
    label: '// 04 — PROJECTS',
    title: 'Own products',
    lead: 'Applications I build under the fridrich.cloud brand.',
    detail: 'Project details',
    openApp: 'Open application',
    openAppExternal: 'Open application ↗',
    backToProjects: '← Back to projects',
    notFound: 'Project not found',
    status: {
      development: 'In development',
      planned: 'Coming soon',
      live: 'Live',
    },
    items: {
      iziweddy: {
        tagline: 'Wedding planner',
        description:
          'Guests, preparations and budget in one place. Track who has confirmed, what still needs to be arranged and how much it all costs.',
      },
      izibudgy: {
        tagline: 'Household budget',
        description:
          'An overview of income, expenses and savings. Where the money goes and how much is left until the end of the month – no Excel spreadsheets.',
      },
    },
  },
  contact: {
    label: '// 05 — CONTACT',
    title: 'Have a project?',
    lead: 'Tell me what you need to solve. I will get back to you and we will arrange a first meeting.',
    directHeading: '// Direct contact',
    writeEmail: 'Send an e-mail',
    form: {
      name: 'Name',
      email: 'E-mail',
      message: 'Message',
      website: 'Website',
      submit: 'Send',
      submitting: 'Sending…',
    },
    status: {
      sending: '> sending message…',
      sent: '> sent. I will get back to you as soon as possible.',
      error: '> sending failed. Please try again or write to me directly by e-mail.',
    },
    consent: {
      text: 'I will use your details only to reply to your enquiry and will delete the message within one year at the latest. More in the {link}.',
      link: 'privacy policy',
    },
  },
  footer: {
    productsLabel: 'Products',
    productsHeading: '// Products',
    contactHeading: '// Contact',
    privacy: 'Privacy policy',
    terms: 'Terms of service',
    identification: '© {year} {name} · Company ID (IČO) {ico} · {address}',
  },
  notFound: {
    label: '// Error 404',
    title: 'Page not found',
    lead: '> the requested address does not exist',
    back: '← Back to home',
  },
  legal: {
    effectiveFrom: 'Effective from {date}',
    tocLabel: 'Table of contents',
    tocTitle: '// Contents',
    privacy: 'Privacy policy',
    terms: 'Terms of service',
    back: '← Back to website',
    czechOnly: 'This document is available in Czech only. The Czech version is legally binding.',
  },
};
