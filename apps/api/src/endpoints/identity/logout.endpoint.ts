import { logout } from '../../application/identity/session.js';
import { clearedSessionCookie, readSessionToken } from '../../http/cookies.js';
import { defineEndpoint } from '../../http/endpoint.js';
import { identityDeps } from '../../infrastructure/container.js';

/** `POST /api/auth/logout` – zruší session na serveru a smaže cookie. Bez těla, odpověď 204. */

export const logoutEndpoint = defineEndpoint({
  name: 'logout',
  method: 'POST',
  route: 'auth/logout',
  access: 'public',
  async handle({ request }) {
    await logout(identityDeps(), readSessionToken(request));
    return { status: 204, headers: { 'Set-Cookie': clearedSessionCookie() } };
  },
});
