import { app } from '@azure/functions';
import { requestLoginCode, verifyLoginCode } from '../application/identity/login.js';
import { registerUser } from '../application/identity/registerUser.js';
import { logout } from '../application/identity/session.js';
import { verifyEmail } from '../application/identity/verifyEmail.js';
import { getConfig } from '../config.js';
import { identityDeps } from '../infrastructure/container.js';
import { clearedSessionCookie, readSessionToken, sessionCookie } from '../http/cookies.js';
import { authenticatedEndpoint, publicEndpoint } from '../http/handler.js';
import { clientIp, json, noContent, readJson } from '../http/responses.js';

/**
 * HTTP vrstva modulu identity.
 *
 * Handlery jen parsují požadavek, zavolají use-case a zabalí výsledek –
 * žádná business logika (CLAUDE.md, pravidlo 2).
 */

const AUTH_METHODS = ['POST', 'OPTIONS'] as const;

app.http('register', {
  methods: [...AUTH_METHODS],
  route: 'auth/register',
  authLevel: 'anonymous',
  handler: publicEndpoint(async (request) => {
    await registerUser(identityDeps(), {
      raw: await readJson(request),
      sourceIp: clientIp(request),
      appUrl: getConfig().appUrl,
    });

    // Odpověď je stejná, ať účet vznikl, nebo byl e-mail už obsazený –
    // jinak by šlo formulářem zjišťovat, kdo je registrovaný.
    return json(request, 202, {
      message: 'Poslali jsme vám e-mail. Otevřením odkazu účet aktivujete.',
    });
  }),
});

app.http('verifyEmail', {
  methods: [...AUTH_METHODS],
  route: 'auth/verify-email',
  authLevel: 'anonymous',
  handler: publicEndpoint(async (request) => {
    const result = await verifyEmail(identityDeps(), { raw: await readJson(request) });

    // Otevření odkazu ze schránky rovnou přihlašuje.
    return json(request, 200, result.user, {
      'Set-Cookie': sessionCookie(result.sessionToken, result.expiresAt),
    });
  }),
});

app.http('login', {
  methods: [...AUTH_METHODS],
  route: 'auth/login',
  authLevel: 'anonymous',
  handler: publicEndpoint(async (request) => {
    await requestLoginCode(identityDeps(), {
      raw: await readJson(request),
      sourceIp: clientIp(request),
    });

    // Neprozrazuje, jestli adresa v systému je.
    return json(request, 202, {
      message: 'Pokud účet existuje, poslali jsme na něj přihlašovací kód.',
    });
  }),
});

app.http('loginVerify', {
  methods: [...AUTH_METHODS],
  route: 'auth/login/verify',
  authLevel: 'anonymous',
  handler: publicEndpoint(async (request) => {
    const result = await verifyLoginCode(identityDeps(), {
      raw: await readJson(request),
      sourceIp: clientIp(request),
    });

    return json(request, 200, result.user, {
      'Set-Cookie': sessionCookie(result.sessionToken, result.expiresAt),
    });
  }),
});

app.http('logout', {
  methods: [...AUTH_METHODS],
  route: 'auth/logout',
  authLevel: 'anonymous',
  handler: publicEndpoint(async (request) => {
    await logout(identityDeps(), readSessionToken(request));
    return noContent(request, { 'Set-Cookie': clearedSessionCookie() });
  }),
});

app.http('me', {
  methods: ['GET', 'OPTIONS'],
  route: 'auth/me',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) =>
    json(request, 200, user.toPublic()),
  ),
});
