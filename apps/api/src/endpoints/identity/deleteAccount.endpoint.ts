import { deleteAccount } from '../../application/identity/account.js';
import { clearedSessionCookie } from '../../http/cookies.js';
import { defineEndpoint } from '../../http/endpoint.js';
import { identityDeps } from '../../infrastructure/container.js';

/**
 * `DELETE /api/auth/account` – smaže účet přihlášeného uživatele i s daty v aplikacích.
 * Bez těla, odpověď 204 a smazaná session cookie.
 */

export const deleteAccountEndpoint = defineEndpoint({
  name: 'deleteAccount',
  method: 'DELETE',
  route: 'auth/account',
  access: 'user',
  async handle({ user }) {
    await deleteAccount(identityDeps(), user.id);
    return { status: 204, headers: { 'Set-Cookie': clearedSessionCookie() } };
  },
});
