/**
 * Struktura portálu na jednom místě.
 *
 * Obsah je záměrně oddělený od komponent – jde ho upravit bez zásahu do
 * rozvržení (doc/wiki/domains/portal.md). Texty žijí v katalogu překladů
 * (`i18n/locales/portal.ts`) pod klíči podle `id` níže; tady zůstávají jen
 * údaje, které se nepřekládají – kotvy, technologie, stavy, adresy.
 */

import { PERSONAL_DATA_COLLECTION_ENABLED } from '@fridrich/shared';

export type NavItemId = 'about' | 'services' | 'process' | 'projects' | 'contact';

export interface NavItem {
  /** Klíč `portal.nav.items.<id>`. */
  id: NavItemId;
  hash: string;
}

export interface Stat {
  /** Klíč popisku `portal.about.stats.<id>`. */
  id: 'experience' | 'sectors' | 'fullStack';
  value: string;
  suffix?: string;
}

/** Témata se překládají (`portal.services.topics.<topic>`), názvy technologií ne. */
export type StackTag = string | { topic: 'webhooks' | 'architecture' | 'audit' };

export interface Service {
  /** Klíče `portal.services.items.<id>.title|description`. */
  id: 'webApps' | 'cloud' | 'integrations' | 'consulting';
  stack: StackTag[];
}

export interface ProcessStep {
  /** Klíče `portal.process.steps.<id>.title|description|output`. */
  id: 'meeting' | 'brief' | 'analysis' | 'demo' | 'development' | 'production';
  number: string;
}

export type ProjectStatus = 'development' | 'planned' | 'live';

export interface Project {
  /** Zároveň adresa detailu `/projekty/<id>` a klíče `portal.projects.items.<id>.tagline|description`. */
  id: 'iziweddy' | 'izibudgy';
  /** Název produktu se nepřekládá. */
  name: string;
  /** Popisek stavu: `portal.projects.status.<status>`. */
  status: ProjectStatus;
  stack: string[];
  /** Cesta k aplikaci uvnitř portálu, např. `/izi-weddy`. */
  url?: string;
}

export const site = {
  name: 'Libor Fridrich',
  domain: 'fridrich.cloud',
  email: 'liborfridrich@gmail.com',
  // Identifikace podnikatele (ARES) – povinná na webu i ve všech právních dokumentech.
  ico: '08005788',
  address: 'Nová 182, 273 51 Velké Přítočno',
  // Používají ho jen české právní dokumenty (`content/legal.ts`), proto zůstává česky.
  legalForm: 'fyzická osoba podnikající, zapsaná v živnostenském rejstříku',
} as const;

// Kotvy zůstávají české – jsou součástí adres, které se podle jazyka nemění.
export const navItems: NavItem[] = [
  { id: 'about', hash: '#o-mne' },
  { id: 'services', hash: '#sluzby' },
  { id: 'process', hash: '#vyvoj' },
  { id: 'projects', hash: '#projekty' },
  { id: 'contact', hash: '#kontakt' },
];

export const hero = {
  eyebrow: '// FRIDRICH.CLOUD',
  title: site.name,
  stack: ['Vue 3', 'Svelte', 'TypeScript', 'Azure', 'Cosmos DB', 'MS SQL', 'Node.js', 'NestJS'],
};

export const about = {
  stats: [
    { id: 'experience', value: '10', suffix: '+' },
    { id: 'sectors', value: '4' },
    { id: 'fullStack', value: 'Full stack' },
  ] satisfies Stat[],
  // Konkrétní jména klientů se na web záměrně nepíšou – jen odvětví.
  sectors: ['manufacturing', 'automotive', 'consumerGoods', 'customDevelopment'] as const,
};

export const services: Service[] = [
  { id: 'webApps', stack: ['Vue 3', 'Svelte', 'TypeScript', 'Node.js', 'NestJS'] },
  { id: 'cloud', stack: ['Azure Functions', 'Cosmos DB', 'Static Web Apps'] },
  { id: 'integrations', stack: ['REST API', { topic: 'webhooks' }, 'ETL'] },
  { id: 'consulting', stack: [{ topic: 'architecture' }, { topic: 'audit' }] },
];

export const processSteps: ProcessStep[] = [
  { id: 'meeting', number: '01' },
  { id: 'brief', number: '02' },
  { id: 'analysis', number: '03' },
  { id: 'demo', number: '04' },
  { id: 'development', number: '05' },
  { id: 'production', number: '06' },
];

export const projects = {
  items: [
    {
      id: 'iziweddy',
      name: 'IziWeddy',
      status: 'development',
      stack: ['Vue 3', 'Azure Functions', 'Cosmos DB'],
      // Aplikace vyžaduje účet a ukládá jména hostů – odkaz jen se zapnutým sběrem údajů.
      url: PERSONAL_DATA_COLLECTION_ENABLED ? '/izi-weddy' : undefined,
    },
    {
      id: 'izibudgy',
      name: 'IziBudgy',
      status: 'planned',
      stack: ['Vue 3', 'Azure Functions', 'Cosmos DB'],
    },
  ] satisfies Project[],
};
