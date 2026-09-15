import * as v from 'valibot';

/**
 * Jazyky a katalogy hlášek.
 *
 * Schémata a API nevrací české věty, ale klíče (`shared.identity.emailInvalid`) –
 * přeloží je frontend (vue-i18n) a e-maily API podle jazyka uživatele.
 * Katalog každé subdomény leží ve stejném souboru jako její schémata, klíče
 * se z něj odvozují funkcí `messageKeys`, takže překlep v klíči je chyba
 * při kompilaci a anglický katalog musí mít přesně stejné klíče jako český
 * (typ `Catalog`). Postup: doc/wiki/architecture/i18n.md.
 */

export const LOCALES = ['cs', 'en'] as const;
export const LocaleSchema = v.picklist(LOCALES);
export type Locale = v.InferOutput<typeof LocaleSchema>;

/** Výchozí jazyk – web je český, angličtina je překlad. */
export const DEFAULT_LOCALE: Locale = 'cs';

/**
 * Jazyk z hlavičky `Accept-Language` nebo jazyka prohlížeče (`en-GB`, `cs,en;q=0.8`).
 * Bere se první podporovaný; slovenština dostane češtinu, všechno ostatní výchozí jazyk.
 */
export function resolveLocale(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase() ?? '';
    const language = tag.split('-')[0];
    if (language === 'cs' || language === 'sk') return 'cs';
    if (language === 'en') return 'en';
  }

  return DEFAULT_LOCALE;
}

/** Strom hlášek – listy jsou texty, uzly skupiny. Pole slouží pro odstavce obsahu. */
export interface MessageTree {
  [key: string]: string | string[] | MessageTree;
}

/**
 * Tvar překladu podle výchozího katalogu: stejné klíče, texty libovolné.
 * `const en: Catalog<typeof cs> = { … }` – chybějící i přebývající klíč neprojde typovou kontrolou.
 */
export type Catalog<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K] extends string[] ? string[] : Catalog<T[K]>;
};

/** Stejný tvar jako katalog, ale v listech jsou úplné klíče (`shared.identity.emailInvalid`). */
export type MessageKeys<T> = {
  readonly [K in keyof T]: T[K] extends string | string[] ? string : MessageKeys<T[K]>;
};

/**
 * Odvodí z katalogu objekt klíčů: `messageKeys({ a: { b: 'text' } }, 'x').a.b === 'x.a.b'`.
 * `prefix` je jmenný prostor, pod kterým katalog skládá `messages.ts`.
 */
export function messageKeys<T extends MessageTree>(tree: T, prefix: string): MessageKeys<T> {
  const keys: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(tree)) {
    const path = `${prefix}.${name}`;
    keys[name] = typeof value === 'string' || Array.isArray(value)
      ? path
      : messageKeys(value, path);
  }

  return keys as MessageKeys<T>;
}
