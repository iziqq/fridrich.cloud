import type { Catalog } from '@fridrich/shared';

/*
 * Texty společné celé aplikaci – přepínač jazyka, skip link, obecná tlačítka.
 * Jmenný prostor `app`.
 */

export const appCs = {
  skipToContent: 'Přeskočit na obsah',
  locale: {
    label: 'Jazyk',
    cs: 'Čeština',
    en: 'English',
    short: { cs: 'CZ', en: 'EN' },
  },
};

export const appEn: Catalog<typeof appCs> = {
  skipToContent: 'Skip to content',
  locale: {
    label: 'Language',
    cs: 'Čeština',
    en: 'English',
    short: { cs: 'CZ', en: 'EN' },
  },
};
