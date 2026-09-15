import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { INACTIVE_ACCOUNT_RETENTION_DAYS, INACTIVE_ACCOUNT_WARNING_DAYS } from '@fridrich/shared';
import { applyAccountRetention, deleteAccount } from '../src/application/identity/account.js';
import { requestLoginCode, verifyLoginCode } from '../src/application/identity/login.js';
import { registerUser } from '../src/application/identity/registerUser.js';
import { resolveSession } from '../src/application/identity/session.js';
import { EmailAddress } from '../src/domain/identity/EmailAddress.js';
import { isDomainError } from '../src/domain/shared/DomainError.js';
import { identityTestDeps, type IdentityTestContext } from './fakes.js';

/**
 * Konec životního cyklu účtu – smazání na žádost a lhůta pro neaktivní účty.
 *
 * Lhůty jsou slíbené v zásadách ochrany osobních údajů, takže testy hlídají
 * hlavně to, aby se nic nesmazalo dřív (bez upozornění) ani nezůstalo déle.
 */

const APP_URL = 'https://www.fridrich.cloud';
const EMAIL = 'jan@example.com';
const IP = '10.0.0.1';
const DAY_MS = 24 * 60 * 60 * 1000;

async function registerAndLogin(deps: IdentityTestContext, email = EMAIL): Promise<string> {
  await registerUser(deps, {
    email,
    displayName: 'Jan Dvořák',
    acceptTerms: true,
    sourceIp: IP,
    appUrl: APP_URL,
  });
  await requestLoginCode(deps, { email, sourceIp: IP });
  const code = /\b(\d{6})\b/.exec(deps.email.last?.text ?? '')?.[1] ?? '';
  const result = await verifyLoginCode(deps, { email, code, sourceIp: IP });
  return result.sessionToken;
}

async function userId(deps: IdentityTestContext, email = EMAIL): Promise<string> {
  const user = await deps.users.findByEmail(EmailAddress.create(email));
  assert.ok(user, 'uživatel neexistuje');
  return user.id;
}

describe('smazání účtu na žádost', () => {
  it('smaže uživatele, přihlášení, kódy i odkazy', async () => {
    const deps = identityTestDeps();
    const sessionToken = await registerAndLogin(deps);
    const id = await userId(deps);

    await deleteAccount(deps, id);

    assert.equal(deps.users.items.size, 0);
    assert.equal(deps.sessions.items.size, 0);
    assert.equal(deps.loginCodes.items.size, 0);
    assert.equal(deps.tokens.items.size, 0);
    assert.equal(await resolveSession(deps, sessionToken), undefined);
  });

  it('dá produktům vědět, ať smažou data uživatele', async () => {
    const deps = identityTestDeps();
    await registerAndLogin(deps);
    const id = await userId(deps);

    await deleteAccount(deps, id);

    assert.deepEqual(deps.eraser.erasedUserIds, [id]);
  });

  it('pošle potvrzení na adresu smazaného účtu', async () => {
    const deps = identityTestDeps();
    await registerAndLogin(deps);

    await deleteAccount(deps, await userId(deps));

    assert.equal(deps.email.last?.to, EMAIL);
    assert.match(deps.email.last?.subject ?? '', /smazán/);
  });

  it('používání přihlášeného účtu se počítá jako aktivita', async () => {
    const deps = identityTestDeps();
    const sessionToken = await registerAndLogin(deps);

    deps.clock.advance(20 * DAY_MS);
    await resolveSession(deps, sessionToken);

    const user = await deps.users.findById(await userId(deps));
    assert.equal(user?.lastActivityAt, deps.clock.now().toISOString());
  });

  it('ostatní účty nechá být', async () => {
    const deps = identityTestDeps();
    await registerAndLogin(deps);
    await registerAndLogin(deps, 'eva@example.com');

    await deleteAccount(deps, await userId(deps));

    assert.equal(deps.users.items.size, 1);
    assert.ok(await deps.users.findByEmail(EmailAddress.create('eva@example.com')));
  });

  it('neexistující účet je notFound', async () => {
    const deps = identityTestDeps();

    await assert.rejects(
      deleteAccount(deps, 'nikdo'),
      (error) => isDomainError(error) && error.kind === 'notFound',
    );
  });
});

describe('lhůta pro neaktivní účty', () => {
  const warnAfterMs = (INACTIVE_ACCOUNT_RETENTION_DAYS - INACTIVE_ACCOUNT_WARNING_DAYS) * DAY_MS;

  it('aktivní účet nechá být', async () => {
    const deps = identityTestDeps();
    await registerAndLogin(deps);
    deps.clock.advance(warnAfterMs - DAY_MS);

    const result = await applyAccountRetention(deps, APP_URL);

    assert.deepEqual(result, { warned: 0, deleted: 0 });
    assert.equal(deps.users.items.size, 1);
  });

  it('měsíc před koncem lhůty pošle upozornění – jen jednou', async () => {
    const deps = identityTestDeps();
    await registerAndLogin(deps);
    deps.clock.advance(warnAfterMs + DAY_MS);

    const first = await applyAccountRetention(deps, APP_URL);
    const sentAfterFirst = deps.email.sent.length;
    deps.clock.advance(DAY_MS);
    const second = await applyAccountRetention(deps, APP_URL);

    assert.deepEqual(first, { warned: 1, deleted: 0 });
    assert.deepEqual(second, { warned: 0, deleted: 0 });
    assert.equal(deps.email.sent.length, sentAfterFirst);
    assert.match(deps.email.last?.subject ?? '', /brzy smaže/);
  });

  it('po celé lhůtě a upozornění účet smaže i s daty v produktech', async () => {
    const deps = identityTestDeps();
    await registerAndLogin(deps);
    const id = await userId(deps);

    deps.clock.advance(warnAfterMs + DAY_MS);
    await applyAccountRetention(deps, APP_URL);
    deps.clock.advance(INACTIVE_ACCOUNT_WARNING_DAYS * DAY_MS);
    const result = await applyAccountRetention(deps, APP_URL);

    assert.deepEqual(result, { warned: 0, deleted: 1 });
    assert.equal(deps.users.items.size, 0);
    assert.deepEqual(deps.eraser.erasedUserIds, [id]);
  });

  it('účet, který upozornění nedostal, nesmaže – nejdřív upozorní', async () => {
    const deps = identityTestDeps();
    await registerAndLogin(deps);
    // Plánovač dlouho neběžel: účet je neaktivní déle než celou lhůtu.
    deps.clock.advance((INACTIVE_ACCOUNT_RETENTION_DAYS + 100) * DAY_MS);

    const result = await applyAccountRetention(deps, APP_URL);

    assert.deepEqual(result, { warned: 1, deleted: 0 });
    assert.equal(deps.users.items.size, 1);
  });

  it('přihlášení po upozornění lhůtu obnoví', async () => {
    const deps = identityTestDeps();
    await registerAndLogin(deps);

    deps.clock.advance(warnAfterMs + DAY_MS);
    await applyAccountRetention(deps, APP_URL);
    // Session za tu dobu dávno vypršela – uživatel se přihlásí znovu kódem z upozornění.
    await requestLoginCode(deps, { email: EMAIL, sourceIp: IP });
    const code = /\b(\d{6})\b/.exec(deps.email.last?.text ?? '')?.[1] ?? '';
    await verifyLoginCode(deps, { email: EMAIL, code, sourceIp: IP });
    deps.clock.advance(INACTIVE_ACCOUNT_WARNING_DAYS * DAY_MS);
    const result = await applyAccountRetention(deps, APP_URL);

    assert.deepEqual(result, { warned: 0, deleted: 0 });
    assert.equal(deps.users.items.size, 1);
  });
});
