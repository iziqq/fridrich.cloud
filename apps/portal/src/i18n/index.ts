import {
  DEFAULT_LOCALE,
  errorKeys,
  LOCALES,
  resolveLocale,
  sharedMessages,
  type Locale,
} from '@fridrich/shared';
import { weddyMessages } from '@fridrich/weddy-shared';
import { computed } from 'vue';
import { createI18n } from 'vue-i18n';
import { appCs, appEn } from './locales/app';
import { identityCs, identityEn } from './locales/identity';
import { portalCs, portalEn } from './locales/portal';
import { weddyCs, weddyEn } from './locales/weddy';

/**
 * Překlady rozhraní (vue-i18n, Composition API).
 *
 * Katalog každého jazyka se skládá z hlášek sdíleného jádra (`shared.*`,
 * `weddyShared.*` – validace, chyby API, popisky výčtů) a z textů obrazovek
 * po oblastech (`app.*`, `portal.*`, `identity.*`, `weddy.*`). Anglické
 * soubory mají typ podle českých, takže chybějící překlad neprojde typecheckem.
 * Pravidla: doc/wiki/architecture/i18n.md.
 */

const STORAGE_KEY = 'fc_locale';

const messages = {
  cs: { ...sharedMessages.cs, ...weddyMessages.cs, app: appCs, portal: portalCs, identity: identityCs, weddy: weddyCs },
  en: { ...sharedMessages.en, ...weddyMessages.en, app: appEn, portal: portalEn, identity: identityEn, weddy: weddyEn },
};

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Jazyk při startu: uložená volba, jinak jazyk prohlížeče (čeština/slovenština → cs,
 * angličtina → en), jinak čeština. Adresy se podle jazyka nemění.
 */
function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // localStorage může být zakázaný (soukromý režim) – rozhodne prohlížeč
  }

  return resolveLocale(navigator.languages?.join(',') || navigator.language);
}

/**
 * České plurály mají tři tvary: 1 host · 2–4 hosté · 5 hostů. Hláška proto
 * píše čtyři varianty oddělené `|` – nula, jedna, dvě až čtyři, pět a víc.
 * Angličtina používá výchozí pravidlo vue-i18n (nula | jedna | víc).
 */
function czechPlural(choice: number, choicesLength: number): number {
  const abs = Math.abs(choice);
  if (choicesLength < 4) return abs === 1 ? 0 : 1;
  if (abs === 0) return 0;
  if (abs === 1) return 1;
  if (abs >= 2 && abs <= 4) return 2;
  return 3;
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
  pluralRules: { cs: czechPlural },
  // Chybějící klíč v produkci nesmí zahltit konzoli – typy ho hlídají už při buildu.
  missingWarn: import.meta.env.DEV,
  fallbackWarn: false,
});

document.documentElement.lang = i18n.global.locale.value;

/** Aktuální jazyk rozhraní – pro formátování čísel, dat a hlavičku `Accept-Language`. */
export const currentLocale = computed<Locale>(() => i18n.global.locale.value);

/** Přepne jazyk, zapamatuje ho a nastaví `lang` stránky (čtečky, dělení slov). */
export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale;
  document.documentElement.lang = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // bez localStorage volba vydrží jen do obnovení stránky
  }
}

/**
 * Přeloží klíč, který přišel z API nebo ze schématu (`ApiError.message`,
 * `fieldErrors`). Neznámý klíč – starší backend, výpadek sítě – skončí obecnou
 * hláškou, ne syrovým klíčem na obrazovce.
 */
export function translateMessage(key: string | undefined): string {
  if (key && i18n.global.te(key)) return i18n.global.t(key);
  return i18n.global.t(errorKeys.unexpected);
}
