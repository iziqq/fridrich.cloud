import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loginUser } from '../src/application/identity/loginUser.js';
import {
  requestPasswordReset,
  resetPassword,
} from '../src/application/identity/passwordReset.js';
import { registerUser } from '../src/application/identity/registerUser.js';
import { logout, resolveSession } from '../src/application/identity/session.js';
import { verifyEmail } from '../src/application/identity/verifyEmail.js';
import { EmailAddress } from '../src/domain/identity/EmailAddress.js';
import { Password } from '../src/domain/identity/Password.js';
import { SESSION_LIFETIME_MS } from '../src/domain/identity/Session.js';
import { isDomainError } from '../src/domain/shared/DomainError.js';
import { identityTestDeps, type IdentityTestContext } from './fakes.js';

const APP_URL = 'https://www.fridrich.cloud';
const GOOD_PASSWORD = 'Sprava-Hesla-2026';

async function register(
  deps: IdentityTestContext,
  email = 'jan@example.com',
  password = GOOD_PASSWORD,
): Promise<void> {
  await registerUser(deps, {
    raw: { email, password, displayName: 'Jan Dvořák' },
    sourceIp: '10.0.0.1',
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

describe('EmailAddress', () => {
  it('normalizuje adresu na malá písmena', () => {
    assert.equal(EmailAddress.create('  Jan.Novak@Example.COM ').value, 'jan.novak@example.com');
  });

  it('odmítne neplatný tvar', () => {
    assert.throws(() => EmailAddress.create('bez-zavinace'), isDomainError);
  });
});

describe('Password', () => {
  it('odmítne heslo kratší než 12 znaků', () => {
    assert.throws(() => Password.create('Kratke1!'), isDomainError);
  });

  it('odmítne heslo obsahující e-mail uživatele', () => {
    assert.throws(
      () => Password.create('jan@example.com-heslo', { email: 'jan@example.com' }),
      isDomainError,
    );
  });

  it('neprozradí heslo v logu ani v JSON', () => {
    const password = Password.create(GOOD_PASSWORD);
    assert.equal(String(password), '[redacted]');
    assert.equal(JSON.stringify({ password }), '{"password":"[redacted]"}');
  });

  it('při ověřování nevynucuje politiku, aby starší účty mohly dál', () => {
    assert.doesNotThrow(() => Password.forVerification('stare-kratke'));
  });
});

describe('registrace', () => {
  it('založí účet a pošle ověřovací odkaz', async () => {
    const deps = identityTestDeps();
    await register(deps);

    assert.equal(deps.users.items.size, 1);
    assert.equal(deps.email.sent.length, 1);
    assert.match(deps.email.last?.subject ?? '', /Potvrďte/);
  });

  it('u obsazeného e-mailu nezaloží druhý účet ani to neprozradí', async () => {
    const deps = identityTestDeps();
    await register(deps);

    const result = await registerUser(deps, {
      raw: { email: 'jan@example.com', password: 'Jine-Heslo-2026!', displayName: 'Podvodník' },
      sourceIp: '10.0.0.2',
      appUrl: APP_URL,
    });

    assert.equal(result, undefined);
    assert.equal(deps.users.items.size, 1);
  });

  it('nový účet má neověřený e-mail', async () => {
    const deps = identityTestDeps();
    await register(deps);

    const user = [...deps.users.items.values()][0];
    assert.equal(user?.emailVerified, false);
  });

  it('respektuje rate limit', async () => {
    const deps = identityTestDeps();
    deps.rateLimiter.blockEverything = true;

    await assert.rejects(register(deps), (error) => isDomainError(error) && error.kind === 'tooManyRequests');
  });
});

describe('ověření e-mailu', () => {
  it('token z e-mailu účet ověří', async () => {
    const deps = identityTestDeps();
    await register(deps);

    const user = await verifyEmail(deps, { raw: { token: tokenFromLastEmail(deps) } });
    assert.equal(user.emailVerified, true);
  });

  it('stejný token podruhé neprojde', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const token = tokenFromLastEmail(deps);

    await verifyEmail(deps, { raw: { token } });
    await assert.rejects(verifyEmail(deps, { raw: { token } }), isDomainError);
  });

  it('token po 24 hodinách vyprší', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const token = tokenFromLastEmail(deps);

    deps.clock.advance(25 * 60 * 60 * 1000);
    await assert.rejects(verifyEmail(deps, { raw: { token } }), isDomainError);
  });
});

describe('přihlášení', () => {
  it('se správnými údaji vrátí uživatele a session token', async () => {
    const deps = identityTestDeps();
    await register(deps);

    const result = await loginUser(deps, {
      raw: { email: 'jan@example.com', password: GOOD_PASSWORD },
      sourceIp: '10.0.0.1',
    });

    assert.equal(result.user.email, 'jan@example.com');
    assert.ok(result.sessionToken);
    assert.equal(deps.sessions.items.size, 1);
  });

  it('funguje i bez ověřeného e-mailu', async () => {
    const deps = identityTestDeps();
    await register(deps);

    const result = await loginUser(deps, {
      raw: { email: 'jan@example.com', password: GOOD_PASSWORD },
      sourceIp: '10.0.0.1',
    });

    assert.equal(result.user.emailVerified, false);
  });

  it('hlásí stejnou chybu pro neznámý účet i špatné heslo', async () => {
    const deps = identityTestDeps();
    await register(deps);

    const wrongPassword = await loginUser(deps, {
      raw: { email: 'jan@example.com', password: 'Uplne-Jine-Heslo1' },
      sourceIp: '10.0.0.1',
    }).catch((error: unknown) => error);

    const unknownUser = await loginUser(deps, {
      raw: { email: 'nikdo@example.com', password: GOOD_PASSWORD },
      sourceIp: '10.0.0.1',
    }).catch((error: unknown) => error);

    assert.ok(isDomainError(wrongPassword) && isDomainError(unknownUser));
    assert.equal(wrongPassword.message, unknownUser.message);
    assert.equal(wrongPassword.kind, 'unauthorized');
  });

  it('u neznámého účtu ověří naprázdno, aby čas odpovědi nic neprozradil', async () => {
    const deps = identityTestDeps();

    await loginUser(deps, {
      raw: { email: 'nikdo@example.com', password: GOOD_PASSWORD },
      sourceIp: '10.0.0.1',
    }).catch(() => undefined);

    assert.equal(deps.hasher.dummyCalls, 1);
  });

  it('přehashuje heslo uložené slabšími parametry', async () => {
    const deps = identityTestDeps();
    deps.hasher.weak = true;
    await register(deps);

    assert.ok([...deps.credentials.items.values()][0]?.passwordHash.startsWith('v1:'));

    deps.hasher.weak = false;
    await loginUser(deps, {
      raw: { email: 'jan@example.com', password: GOOD_PASSWORD },
      sourceIp: '10.0.0.1',
    });

    assert.ok([...deps.credentials.items.values()][0]?.passwordHash.startsWith('v2:'));
  });
});

describe('session', () => {
  it('platný token vrátí přihlášeného uživatele', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const { sessionToken } = await loginUser(deps, {
      raw: { email: 'jan@example.com', password: GOOD_PASSWORD },
      sourceIp: '10.0.0.1',
    });

    const user = await resolveSession(deps, sessionToken);
    assert.equal(user?.email.value, 'jan@example.com');
  });

  it('po vypršení platnosti session zanikne', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const { sessionToken } = await loginUser(deps, {
      raw: { email: 'jan@example.com', password: GOOD_PASSWORD },
      sourceIp: '10.0.0.1',
    });

    deps.clock.advance(SESSION_LIFETIME_MS + 1000);

    assert.equal(await resolveSession(deps, sessionToken), undefined);
    assert.equal(deps.sessions.items.size, 0);
  });

  it('odhlášení session smaže', async () => {
    const deps = identityTestDeps();
    await register(deps);
    const { sessionToken } = await loginUser(deps, {
      raw: { email: 'jan@example.com', password: GOOD_PASSWORD },
      sourceIp: '10.0.0.1',
    });

    await logout(deps, sessionToken);
    assert.equal(await resolveSession(deps, sessionToken), undefined);
  });

  it('bez cookie vrátí undefined místo výjimky', async () => {
    const deps = identityTestDeps();
    assert.equal(await resolveSession(deps, undefined), undefined);
  });
});

describe('obnova hesla', () => {
  it('neznámou adresu nijak neodliší', async () => {
    const deps = identityTestDeps();

    await requestPasswordReset(deps, {
      raw: { email: 'nikdo@example.com' },
      sourceIp: '10.0.0.1',
      appUrl: APP_URL,
    });

    assert.equal(deps.email.sent.length, 0);
  });

  it('nastaví nové heslo a odhlásí všechna zařízení', async () => {
    const deps = identityTestDeps();
    await register(deps);

    await loginUser(deps, {
      raw: { email: 'jan@example.com', password: GOOD_PASSWORD },
      sourceIp: '10.0.0.1',
    });
    await loginUser(deps, {
      raw: { email: 'jan@example.com', password: GOOD_PASSWORD },
      sourceIp: '10.0.0.2',
    });
    assert.equal(deps.sessions.items.size, 2);

    await requestPasswordReset(deps, {
      raw: { email: 'jan@example.com' },
      sourceIp: '10.0.0.1',
      appUrl: APP_URL,
    });

    await resetPassword(deps, {
      raw: { token: tokenFromLastEmail(deps), password: 'Nove-Bezpecne-Heslo9' },
      appUrl: APP_URL,
    });

    assert.equal(deps.sessions.items.size, 0);

    const result = await loginUser(deps, {
      raw: { email: 'jan@example.com', password: 'Nove-Bezpecne-Heslo9' },
      sourceIp: '10.0.0.1',
    });
    assert.ok(result.sessionToken);
  });

  it('staré heslo po obnově neprojde', async () => {
    const deps = identityTestDeps();
    await register(deps);

    await requestPasswordReset(deps, {
      raw: { email: 'jan@example.com' },
      sourceIp: '10.0.0.1',
      appUrl: APP_URL,
    });
    await resetPassword(deps, {
      raw: { token: tokenFromLastEmail(deps), password: 'Nove-Bezpecne-Heslo9' },
      appUrl: APP_URL,
    });

    await assert.rejects(
      loginUser(deps, {
        raw: { email: 'jan@example.com', password: GOOD_PASSWORD },
        sourceIp: '10.0.0.1',
      }),
      isDomainError,
    );
  });

  it('kliknutí na odkaz zároveň ověří e-mail', async () => {
    const deps = identityTestDeps();
    await register(deps);

    await requestPasswordReset(deps, {
      raw: { email: 'jan@example.com' },
      sourceIp: '10.0.0.1',
      appUrl: APP_URL,
    });
    await resetPassword(deps, {
      raw: { token: tokenFromLastEmail(deps), password: 'Nove-Bezpecne-Heslo9' },
      appUrl: APP_URL,
    });

    assert.equal([...deps.users.items.values()][0]?.emailVerified, true);
  });

  it('token pro obnovu vyprší po hodině', async () => {
    const deps = identityTestDeps();
    await register(deps);

    await requestPasswordReset(deps, {
      raw: { email: 'jan@example.com' },
      sourceIp: '10.0.0.1',
      appUrl: APP_URL,
    });
    const token = tokenFromLastEmail(deps);

    deps.clock.advance(61 * 60 * 1000);

    await assert.rejects(
      resetPassword(deps, { raw: { token, password: 'Nove-Bezpecne-Heslo9' }, appUrl: APP_URL }),
      isDomainError,
    );
  });

  it('ověřovací token nelze použít k obnově hesla', async () => {
    const deps = identityTestDeps();
    await register(deps);

    // Token z registrace má účel emailVerification.
    const token = tokenFromLastEmail(deps);

    await assert.rejects(
      resetPassword(deps, { raw: { token, password: 'Nove-Bezpecne-Heslo9' }, appUrl: APP_URL }),
      isDomainError,
    );
  });
});
