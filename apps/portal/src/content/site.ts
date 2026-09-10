/**
 * Texty portálu na jednom místě.
 *
 * Obsah je záměrně oddělený od komponent – jde ho upravit bez zásahu do
 * rozvržení a později přeložit (doc/portal.md, kap. 7).
 */

export interface NavItem {
  label: string;
  hash: string;
}

export interface Stat {
  value: string;
  suffix?: string;
  label: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  stack: string[];
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  output: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: 'development' | 'planned' | 'live';
  statusLabel: string;
  stack: string[];
  url?: string;
}

export const site = {
  name: 'Libor Fridrich',
  domain: 'fridrich.cloud',
  tagline: 'Vývoj na míru',
  email: 'liborfridrich@gmail.com',
} as const;

export const navItems: NavItem[] = [
  { label: 'O mně', hash: '#o-mne' },
  { label: 'Služby', hash: '#sluzby' },
  { label: 'Vývoj', hash: '#vyvoj' },
  { label: 'Projekty', hash: '#projekty' },
  { label: 'Kontakt', hash: '#kontakt' },
];

export const hero = {
  eyebrow: '// FRIDRICH.CLOUD',
  title: 'Libor Fridrich',
  subtitle: 'Vývoj na míru',
  lead: '10 let full stack vývoje. Weby a aplikace na míru – od první schůzky až po produkci.',
  stack: ['Vue 3', 'TypeScript', 'Azure', 'Cosmos DB', 'Node.js'],
};

export const about = {
  label: '// 01 — O MNĚ',
  title: 'Deset let u toho, co běží v produkci',
  paragraphs: [
    'Jsem full stack vývojář. Píšu frontend, backend i databázovou vrstvu – nepředávám práci na půl cesty a nečekám, až ji někdo dokončí za mě.',
    'Deset let dělám software pro velké mezinárodní firmy – průmyslovou výrobu, automotive i spotřební zboží. Část zakázek jsem vedl přímo, část pod dodavatelskými firmami. Je to prostředí, kde kód musí vydržet roky a kde chyba stojí peníze.',
    'Vedle korporátních zakázek dělám i menší vývoj na míru. Tam si zákazník sedne rovnou s člověkem, který jeho aplikaci i naprogramuje – žádný řetěz manažerů mezi zadáním a kódem.',
  ],
  stats: [
    { value: '10', suffix: '+', label: 'let praxe' },
    { value: '4', label: 'odvětví' },
    { value: 'Full stack', label: 'frontend · backend · cloud' },
  ] satisfies Stat[],
  // Konkrétní jména klientů se na web záměrně nepíšou – jen odvětví.
  sectorsLabel: '// Odvětví, ve kterých jsem pracoval',
  sectors: ['Průmyslová výroba', 'Automotive', 'Spotřební zboží', 'Zakázkový vývoj'],
};

export const services = {
  label: '// 02 — SLUŽBY',
  title: 'Co pro vás udělám',
  items: [
    {
      id: 'web-apps',
      title: 'Webové aplikace na míru',
      description:
        'Návrh a vývoj od nuly. Frontend, backend i databáze – jedna aplikace, jeden člověk, který za ni ručí.',
      stack: ['Vue 3', 'TypeScript', 'Node.js'],
    },
    {
      id: 'cloud',
      title: 'Cloudová řešení (Azure)',
      description:
        'Architektura, nasazení a provoz v Azure. Včetně toho, aby účet za cloud nerostl rychleji než aplikace.',
      stack: ['Azure Functions', 'Cosmos DB', 'Static Web Apps'],
    },
    {
      id: 'integrations',
      title: 'Integrace a automatizace',
      description:
        'Propojení systémů, které spolu zatím nemluví. API, datové toky a náhrada ruční práce, která vás zdržuje.',
      stack: ['REST API', 'Webhooky', 'ETL'],
    },
    {
      id: 'consulting',
      title: 'Konzultace a code review',
      description:
        'Posouzení architektury, technický audit nebo doprovod vašeho týmu. Řeknu i to, co nechcete slyšet.',
      stack: ['Architektura', 'Audit', 'Mentoring'],
    },
  ] satisfies Service[],
};

export const process = {
  label: '// 03 — VÝVOJ',
  title: 'Jak spolupráce probíhá',
  lead: 'Šest kroků. Víte dopředu, co se bude dít a co z každého kroku vzejde.',
  steps: [
    {
      number: '01',
      title: 'Úvodní schůzka',
      description:
        'Sejdeme se a projdeme, co potřebujete a proč. Ptám se hlavně na to, co má výsledek vyřešit – ne na to, jak má vypadat.',
      output: 'Zápis ze schůzky',
    },
    {
      number: '02',
      title: 'Potvrzení zadání',
      description:
        'Sepíšu požadavky vlastními slovy a potvrdíme si, že jsme se pochopili stejně. Tady se odhalí většina nedorozumění.',
      output: 'Odsouhlasené zadání',
    },
    {
      number: '03',
      title: 'Analýza',
      description:
        'Ověřím, že zadání dává technicky i ekonomicky smysl. Navrhnu řešení, rozsah, cenu a termín.',
      output: 'Návrh řešení, cena, termín',
    },
    {
      number: '04',
      title: 'Demo',
      description:
        'Postavím proklikatelné demo s nasimulovanými daty. Vzhled a postupy si odsouhlasíme na něm – dřív, než se napíše drahý kód.',
      output: 'Proklikatelné demo',
    },
    {
      number: '05',
      title: 'Hlavní vývoj',
      description:
        'Vzniká ostrá aplikace. Průběžně ji nasazuji na testovací prostředí, kde si ji otestujete ještě před spuštěním.',
      output: 'Odladěná aplikace na testu',
    },
    {
      number: '06',
      title: 'Produkce',
      description:
        'Nasazení do ostrého provozu, předání a další podpora. Aplikace vám nezůstane v ruce bez pomoci.',
      output: 'Běžící aplikace',
    },
  ] satisfies ProcessStep[],
  note: 'Díky demu ve čtvrtém kroku se změny vzhledu a postupů řeší tam, kde jsou levné. Do ostrého vývoje jdeme až s tím, co je odsouhlasené.',
};

export const projects = {
  label: '// 04 — PROJEKTY',
  title: 'Vlastní produkty',
  lead: 'Aplikace, které stavím pod značkou fridrich.cloud.',
  items: [
    {
      id: 'iziweddy',
      name: 'IziWeddy',
      tagline: 'Svatební plánovač',
      description:
        'Hosté, přípravy a rozpočet na jednom místě. Sledujte, kdo potvrdil účast, co je ještě potřeba zařídit a kolik to celé stojí.',
      status: 'development',
      statusLabel: 'Ve vývoji',
      stack: ['Vue 3', 'Azure Functions', 'Cosmos DB'],
      url: 'https://iziweddy.fridrich.cloud',
    },
    {
      id: 'izibudgy',
      name: 'IziBudgy',
      tagline: 'Rozpočet domácnosti',
      description:
        'Přehled příjmů, výdajů a úspor. Kam peníze tečou a kolik zbývá do konce měsíce – bez tabulek v Excelu.',
      status: 'planned',
      statusLabel: 'Připravujeme',
      stack: ['Vue 3', 'Azure Functions', 'Cosmos DB'],
    },
  ] satisfies Project[],
};

export const contact = {
  label: '// 05 — KONTAKT',
  title: 'Máte projekt?',
  lead: 'Napište mi, co potřebujete vyřešit. Ozvu se a domluvíme si první schůzku.',
};
