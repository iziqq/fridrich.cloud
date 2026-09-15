import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TERMS_VERSION } from '@fridrich/shared';
import { requestLoginCode, verifyLoginCode } from '../src/application/identity/login.js';
import { registerUser } from '../src/application/identity/registerUser.js';
import { logout, resolveSession } from '../src/application/identity/session.js';
import { verifyEmail } from '../src/application/identity/verifyEmail.js';
import { EmailAddress } from '../src/domain/identity/EmailAddress.js';
import {
  LOGIN_CODE_LIFETIME_MS,
  LOGIN_CODE_MAX_ATTEMPTS,
} from '../src/domain/identity/LoginCode.js';
import { SESSION_LIFETIME_MS } from '../src/domain/identity/Session.js';
import { isDomainError } from '../src/domain/shared/DomainError.js';
import { identityTestDeps, type IdentityTestContext } from './fakes.js';

const APP_URL = 'https://www.fridrich.cloud';
const EMAIL = 'jan@example.com';
const IP = '10.0.0.1';

async function register(deps: IdentityTestContext, email = EMAIL): Promise<void> {
  await registerUser(deps, {
    email,
    displayName: 'Jan Dvořák',
    acceptTerms: true,
    sourceIp: IP,
    appUrl: APP_URL,
  });
}

/** Vytáhne token z odkazu v posledním odeslaném e-mailu. */
function tokenFromLastEmail(deps: IdentityTestContext): string {
  const text = deps.email.last?.text ?? '';
  const match = /token=([^\s&]+)/.exec(text);
  assert.ok(match?.[1], 'e-mail neobsahuje odkaz s tokenem');
  return decodeURIComponent(match[1]);
}

/** Vytáhne šestimístný kód z posledního e-mailu. */
function codeFromLastEmail(deps: IdentityTestContext): string {
  const match = /\b(\d{6})\b/.exec(deps.email.last?.text ?? '');
  assert.ok(match?.[1], 'e-mail neobsahuje přihlašovací kód');
  return match[1];
}

/** Registrace + vyžádání kódu; vrací kód, který uživateli přišel. */
async function registerAndRequestCode(deps: IdentityTestContext): Promise<string> {
  await register(deps);
  await requestLoginCode(deps, { email: EMAIL, sourceIp: IP });
  return codeFromLastEmail(deps);
}

describe('EmailAddress', () => {
  it('normalizuje adresu na malá písmena', () => {
    assert.equal(EmailAddress.create('  Jan.Novak@Example.COM ').value, 'jan.novak@example.com');
  });

  it('odmítne neplatný tvar', () => {
    assert.throws(() => EmailAddress.create('bez-zavinace'), isDomainError);
  });
});

describe('registrace', () => {
  it('založí účet z jména a e-mailu a pošle aktivační odkaz', async () => {
    const deps = identityTestDeps();
    await register(deps);

    assert.equal(deps.users.items.size, 1);
    assert.equal(deps.email.sent.length, 1);
    assert.match(deps.email.last?.subject ?? '', /Aktivujte/);
  });

  it('nový účet má neověřený e-mail', async () => {
    const deps = identityTestDeps();
    await register(deps);

    assert.equal([...deps.users.items.values()][0]?.emailVerified, false);
  });

  it('u obsazeného e-mailu nezaloží druhý účet ani to neprozradí', async () => {
    const deps = identityTestDeps();
    await register(deps);

    const result = await registerUser(deps, {
      email: EMAIL,
      displayName: 'Podvodník',
      acceptTerms: true,
      sourceIp: '10.0.0.2',
      appUrl: APP_URL,
    });

    assert.equal(result, undefined);
    assert.equal(deps.users.items.size, 1);
  });

  it('majiteli obsazené adresy pošle upozornění místo dalšího účtu', async () => {
    const deps = identityTestDeps();
    await register(deps);

    await registerUser(deps, {
      email: EMAIL,
      displayName: 'Podvodník',
      acceptTerms: true,
      sourceIp: '10.0.0.2',
      appUrl: APP_URL,
    });

    assert.match(deps.email.last?.subject ?? '', /už existuje/);
    // Upozornění nesmí nést nic, čím by se dal účet převzít.
    assert.doesNotMatch(deps.email.last?.text ?? '', /token=/);
  });

  it('odmítne registraci bez jména', async () => {
    const deps = identityTestDeps();

    await assert.rejects(
      registerUser(deps, {
        email: EMAIL,
        displayName: '   ',
        acceptTerms: true,
        sourceIp: IP,
        appUrl: APP_URL,
      }),
      isDomainError,
    );
  });

  it('bez souhlasu s obchodními podmínkami účet nezaloží', async () => {
    const deps = identityTestDeps();

    await assert.rejects(
      registerUser(deps, {
        email: EMAIL,
        displayName: 'Jan Dvořák',
        acceptTerms: false,
        sourceIp: IP,
        appUrl: APP_URL,
      }),
      (error) => isDomainError(error) && error.details[0]?.field === 'acceptTerms',
    );
    assert.equal(deps.users.items.size, 0);
  });

  it('uloží verzi obchodních podmínek, se kterou uživatel souhlasil', async () => {
    const deps = identityTestDeps();
    await register(deps);

    const [state] = [...deps.users.items.values()];
    assert.equal(state?.termsVersion, TERMS_VERSION);
    assert.equal(state?.termsAcceptedAt, deps.clock.now().toISOString());
  });

  it('respektuje rate limit', async () => {
    const deps = identityTestDeps();
    deps.rateLimiter.blockEverything = true;

    await assert.rejects(
      register(deps),
      (error) => isDomainError(error) && error.kind === 'tooManyRequests',
    );
  });
});

describe('aktivace účtu odkazem', () => {
  it('token z e-mailu účet ověří a rovnou přihlásí', async () => {
    const deps = identityTestDeps();
    await register(deps);

    const result = await verifyEmail(deps, { token: tokenFromLastEmail(deps) });

    assert.equal(result.user.emailVerified, true);
    assert.ok(result.sessionToken);
    assert.equal(deps.sessions.items.size, 1);
  });

  it('stejný token podruhé neprojde', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const token = tokenFromLastEmail(deps);

    await verifyEmail(deps, { token });
    await assert.rejects(verifyEmail(deps, { token }), isDomainError);
  });

  it('token po 24 hodinách vyprší', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const token = tokenFromLastEmail(deps);

    deps.clock.advance(25 * 60 * 60 * 1000);
    await assert.rejects(verifyEmail(deps, { token }), isDomainError);
  });
});

describe('přihlášení kódem – vyžádání', () => {
  it('pošle šestimístný kód na registrovanou adresu', async () => {
    const deps = identityTestDeps();
    await register(deps);

    await requestLoginCode(deps, { email: EMAIL, sourceIp: IP });

    assert.match(deps.email.last?.subject ?? '', /přihlašovací kód/);
    assert.match(codeFromLastEmail(deps), /^\d{6}$/);
    assert.equal(deps.loginCodes.items.size, 1);
  });

  it('neznámou adresu nijak neodliší', async () => {
    const deps = identityTestDeps();

    await requestLoginCode(deps, { email: 'nikdo@example.com', sourceIp: IP });

    assert.equal(deps.email.sent.length, 0);
    assert.equal(deps.loginCodes.items.size, 0);
  });

  it('nový kód zneplatní ten předchozí', async () => {
    const deps = identityTestDeps();
    const firstCode = await registerAndRequestCode(deps);

    await requestLoginCode(deps, { email: EMAIL, sourceIp: IP });
    assert.equal(deps.loginCodes.items.size, 1);

    await assert.rejects(
      verifyLoginCode(deps, { email: EMAIL, code: firstCode, sourceIp: IP }),
      isDomainError,
    );
  });

  it('kód v e-mailu nechodí s odkazem, který by šlo jen kliknout', async () => {
    const deps = identityTestDeps();
    await registerAndRequestCode(deps);

    assert.doesNotMatch(deps.email.last?.text ?? '', /https?:\/\//);
  });

  it('respektuje rate limit', async () => {
    const deps = identityTestDeps();
    await register(deps);
    deps.rateLimiter.blockEverything = true;

    await assert.rejects(
      requestLoginCode(deps, { email: EMAIL, sourceIp: IP }),
      (error) => isDomainError(error) && error.kind === 'tooManyRequests',
    );
  });
});

describe('přihlášení kódem – ověření', () => {
  it('správný kód vrátí uživatele a session token', async () => {
    const deps = identityTestDeps();
    const code = await registerAndRequestCode(deps);

    const result = await verifyLoginCode(deps, { email: EMAIL, code, sourceIp: IP });

    assert.equal(result.user.email, EMAIL);
    assert.ok(result.sessionToken);
    assert.equal(deps.sessions.items.size, 1);
  });

  it('kód projde i s mezerami, jak ho uživatel opíše', async () => {
    const deps = identityTestDeps();
    const code = await registerAndRequestCode(deps);

    const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
    const result = await verifyLoginCode(deps, { email: EMAIL, code: spaced, sourceIp: IP });

    assert.ok(result.sessionToken);
  });

  it('úspěšné přihlášení zároveň ověří e-mail', async () => {
    const deps = identityTestDeps();
    const code = await registerAndRequestCode(deps);

    const result = await verifyLoginCode(deps, { email: EMAIL, code, sourceIp: IP });

    assert.equal(result.user.emailVerified, true);
  });

  it('stejný kód podruhé neprojde', async () => {
    const deps = identityTestDeps();
    const code = await registerAndRequestCode(deps);

    await verifyLoginCode(deps, { email: EMAIL, code, sourceIp: IP });

    await assert.rejects(
      verifyLoginCode(deps, { email: EMAIL, code, sourceIp: IP }),
      isDomainError,
    );
  });

  it('hlásí stejnou chybu pro neznámý účet i špatný kód', async () => {
    const deps = identityTestDeps();
    await registerAndRequestCode(deps);

    const wrongCode = await verifyLoginCode(deps, {
      email: EMAIL,
      code: '999999',
      sourceIp: IP,
    }).catch((error: unknown) => error);

    const unknownUser = await verifyLoginCode(deps, {
      email: 'nikdo@example.com',
      code: '999999',
      sourceIp: IP,
    }).catch((error: unknown) => error);

    assert.ok(isDomainError(wrongCode) && isDomainError(unknownUser));
    assert.deepEqual(wrongCode.details, unknownUser.details);
  });

  it('po vyčerpání pokusů neprojde ani správný kód', async () => {
    const deps = identityTestDeps();
    const code = await registerAndRequestCode(deps);

    for (let attempt = 0; attempt < LOGIN_CODE_MAX_ATTEMPTS; attempt += 1) {
      await assert.rejects(
        verifyLoginCode(deps, { email: EMAIL, code: '000000', sourceIp: IP }),
        isDomainError,
      );
    }

    await assert.rejects(
      verifyLoginCode(deps, { email: EMAIL, code, sourceIp: IP }),
      isDomainError,
    );
    assert.equal(deps.sessions.items.size, 0);
  });

  it('kód po deseti minutách vyprší', async () => {
    const deps = identityTestDeps();
    const code = await registerAndRequestCode(deps);

    deps.clock.advance(LOGIN_CODE_LIFETIME_MS + 1000);

    await assert.rejects(
      verifyLoginCode(deps, { email: EMAIL, code, sourceIp: IP }),
      isDomainError,
    );
  });

  it('ověřovací token z odkazu nelze použít jako přihlašovací kód', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const token = tokenFromLastEmail(deps);
    await requestLoginCode(deps, { email: EMAIL, sourceIp: IP });

    await assert.rejects(
      verifyLoginCode(deps, { email: EMAIL, code: token, sourceIp: IP }),
      isDomainError,
    );
  });

  it('respektuje rate limit', async () => {
    const deps = identityTestDeps();
    const code = await registerAndRequestCode(deps);
    deps.rateLimiter.blockEverything = true;

    await assert.rejects(
      verifyLoginCode(deps, { email: EMAIL, code, sourceIp: IP }),
      (error) => isDomainError(error) && error.kind === 'tooManyRequests',
    );
  });
});

describe('session', () => {
  async function login(deps: IdentityTestContext, sourceIp = IP): Promise<string> {
    await requestLoginCode(deps, { email: EMAIL, sourceIp });
    const code = codeFromLastEmail(deps);
    const result = await verifyLoginCode(deps, { email: EMAIL, code, sourceIp });
    return result.sessionToken;
  }

  it('platný token vrátí přihlášeného uživatele', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const sessionToken = await login(deps);

    const user = await resolveSession(deps, sessionToken);
    assert.equal(user?.email.value, EMAIL);
  });

  it('po vypršení platnosti session zanikne', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const sessionToken = await login(deps);

    deps.clock.advance(SESSION_LIFETIME_MS + 1000);

    assert.equal(await resolveSession(deps, sessionToken), undefined);
    assert.equal(deps.sessions.items.size, 0);
  });

  it('odhlášení session smaže', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const sessionToken = await login(deps);

    await logout(deps, sessionToken);
    assert.equal(await resolveSession(deps, sessionToken), undefined);
  });

  it('odhlášení na jednom zařízení nechá ostatní přihlášené', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const first = await login(deps, '10.0.0.1');
    const second = await login(deps, '10.0.0.2');

    await logout(deps, first);

    assert.equal(await resolveSession(deps, first), undefined);
    assert.ok(await resolveSession(deps, second));
  });

  it('bez cookie vrátí undefined místo výjimky', async () => {
    const deps = identityTestDeps();
    assert.equal(await resolveSession(deps, undefined), undefined);
  });
});
