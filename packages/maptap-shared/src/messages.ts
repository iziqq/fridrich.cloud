import type { Locale } from '@fridrich/shared';
import { scoresMessages } from './scores.js';

/*
 * Katalog hlášek a popisků MapTapu po jazycích – jmenný prostor `maptapShared`.
 * Frontend ho přimíchá do vue-i18n vedle `sharedMessages`.
 */

function forLocale(locale: Locale) {
  return {
    maptapShared: {
      scores: scoresMessages[locale],
    },
  };
}

export const maptapMessages = {
  cs: forLocale('cs'),
  en: forLocale('en'),
};
