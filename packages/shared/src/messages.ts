import { errorMessages } from './api.js';
import { contactMessages } from './contact.js';
import type { Locale } from './i18n.js';
import { identityMessages } from './identity.js';
import { commonMessages } from './validation.js';

/*
 * Katalog hlášek sdíleného jádra po jazycích.
 *
 * Jmenné prostory odpovídají prefixům klíčů v souborech subdomén
 * (`messageKeys(cs, 'shared.identity')`). Frontend katalog přimíchá do vue-i18n.
 */

function forLocale(locale: Locale) {
  return {
    shared: {
      common: commonMessages[locale],
      errors: errorMessages[locale],
      identity: identityMessages[locale],
      contact: contactMessages[locale],
    },
  };
}

export const sharedMessages = {
  cs: forLocale('cs'),
  en: forLocale('en'),
};
