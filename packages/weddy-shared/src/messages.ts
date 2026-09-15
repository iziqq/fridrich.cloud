import type { Locale } from '@fridrich/shared';
import { guestsMessages } from './guests.js';
import { planningMessages } from './planning.js';
import { weddingMessages } from './wedding.js';

/*
 * Katalog hlášek a popisků IziWeddy po jazycích – jmenný prostor `weddyShared`.
 * Frontend ho přimíchá do vue-i18n vedle `sharedMessages`.
 */

function forLocale(locale: Locale) {
  return {
    weddyShared: {
      wedding: weddingMessages[locale],
      guests: guestsMessages[locale],
      planning: planningMessages[locale],
    },
  };
}

export const weddyMessages = {
  cs: forLocale('cs'),
  en: forLocale('en'),
};
