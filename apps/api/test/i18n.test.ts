import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  commonKeys,
  contactKeys,
  errorKeys,
  identityKeys,
  LOCALES,
  resolveLocale,
  sharedMessages,
  type MessageTree,
} from '@fridrich/shared';
import { guestsKeys, planningKeys, weddingKeys, weddyMessages } from '@fridrich/weddy-shared';
import { accountDeletedEmail, loginCodeEmail } from '../src/application/identity/emails.js';
import { requestLoginCode, verifyLoginCode } from '../src/application/identity/login.js';
import { registerUser } from '../src/application/identity/registerUser.js';
import { resolveSession } from '../src/application/identity/session.js';
import { EmailAddress } from '../src/domain/identity/EmailAddress.js';
import { identityTestDeps } from './fakes.js';

/**
 * Překlady – katalogy hlášek sdíleného jádra a jazyk e-mailů.
 *
 * Tvar anglického katalogu hlídá už typ `Catalog`; testy navíc ověřují, že
 * každý klíč, který schémata a API vrací, v obou jazycích opravdu vede na
 * text a že texty nerozbijí syntaxi vue-i18n.
 */

/** Najde text podle tečkového klíče (`shared.identity.emailInvalid`). */
function lookup(tree: MessageTree, key: string): unknown {
  return key.split('.').reduce<unknown>(
    (node, part) => (node && typeof node === 'object' ? (node as MessageTree)[part] : undefined),
    tree,
  );
}

/** Všechny listy stromu klíčů (`identityKeys`, `guestsKeys.status`, …). */
function leaves(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  return Object.values(node as Record<string, unknown>).flatMap(leaves);
}

/** Všechny texty katalogu. */
function texts(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node as string[];
  return Object.values(node as Record<string, unknown>).flatMap(texts);
}

const ALL_KEYS = [
  commonKeys,
  errorKeys,
  identityKeys,
  contactKeys,
  weddingKeys,
  guestsKeys,
  planningKeys,
].flatMap(leaves);

describe('katalogy hlášek', () => {
  for (const locale of LOCALES) {
    const catalog = { ...sharedMessages[locale], ...weddyMessages[locale] } as MessageTree;

    it(`každý klíč schémat a API má text – ${locale}`, () => {
      const missing = ALL_KEYS.filter((key) => typeof lookup(catalog, key) !== 'string');
      assert.deepEqual(missing, []);
    });

    it(`texty neobsahují znaky, které vue-i18n bere jako syntaxi – ${locale}`, () => {
      // `@` odkazuje na jinou hlášku, `{}` je interpolace, `|` plurál.
      const broken = texts(catalog).filter((text) => /[@{}|]/.test(text));
      assert.deepEqual(broken, []);
    });
  }

  it('anglický katalog není jen kopie českého', () => {
    assert.notEqual(
      lookup(sharedMessages.en as MessageTree, identityKeys.emailInvalid),
      lookup(sharedMessages.cs as MessageTree, identityKeys.emailInvalid),
    );
  });
});

describe('resolveLocale', () => {
  it('vybere první podporovaný jazyk z Accept-Language', () => {
    assert.equal(resolveLocale('en-GB,en;q=0.9'), 'en');
    assert.equal(resolveLocale('de-DE,cs;q=0.8'), 'cs');
  });

  it('slovenštině dá češtinu a neznámému jazyku výchozí', () => {
    assert.equal(resolveLocale('sk'), 'cs');
    assert.equal(resolveLocale('de'), 'cs');
    assert.equal(resolveLocale(undefined), 'cs');
  });
});

describe('jazyk e-mailů a účtu', () => {
  const APP_URL = 'https://www.fridrich.cloud';
  const EMAIL = 'john@example.com';
  const IP = '10.0.0.1';

  it('e-maily existují v obou jazycích', () => {
    assert.match(loginCodeEmail(EMAIL, '123456', 10, 'cs').subject, /přihlašovací kód/);
    assert.match(loginCodeEmail(EMAIL, '123456', 10, 'en').subject, /sign-in code/);
    assert.match(accountDeletedEmail(EMAIL, { kind: 'request' }, 'en').html, /lang="en"/);
  });

  it('registrace v angličtině pošle anglický e-mail a jazyk uloží k účtu', async () => {
    const deps = identityTestDeps();

    await registerUser(deps, {
      email: EMAIL,
      displayName: 'John Smith',
      acceptTerms: true,
      sourceIp: IP,
      appUrl: APP_URL,
      locale: 'en',
    });

    assert.match(deps.email.last?.subject ?? '', /Activate your account/);
    const user = await deps.users.findByEmail(EmailAddress.create(EMAIL));
    assert.equal(user?.locale, 'en');
  });

  it('přepnutí jazyka na webu se uloží při dalším požadavku přihlášeného uživatele', async () => {
    const deps = identityTestDeps();
    await registerUser(deps, {
      email: EMAIL,
      displayName: 'John Smith',
      acceptTerms: true,
      sourceIp: IP,
      appUrl: APP_URL,
      locale: 'cs',
    });
    await requestLoginCode(deps, { email: EMAIL, sourceIp: IP, locale: 'cs' });
    const code = /\b(\d{6})\b/.exec(deps.email.last?.text ?? '')?.[1] ?? '';
    const { sessionToken } = await verifyLoginCode(deps, { email: EMAIL, code, sourceIp: IP, locale: 'cs' });

    await resolveSession(deps, sessionToken, 'en');

    const user = await deps.users.findByEmail(EmailAddress.create(EMAIL));
    assert.equal(user?.locale, 'en');
  });
});
