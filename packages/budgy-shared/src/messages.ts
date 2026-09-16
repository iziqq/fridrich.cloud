import type { Locale } from '@fridrich/shared';
import { entriesMessages } from './entries.js';

/*
 * Katalog hlášek a popisků IziBudgy po jazycích – jmenný prostor `budgyShared`.
 * Frontend ho přimíchá do vue-i18n vedle `sharedMessages`.
 */

function forLocale(locale: Locale) {
  return {
    budgyShared: {
      entries: entriesMessages[locale],
    },
  };
}

export const budgyMessages = {
  cs: forLocale('cs'),
  en: forLocale('en'),
};
