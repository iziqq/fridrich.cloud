import { callEndpoint } from '@/api/http';

/**
 * `DELETE /api/auth/account` – smaže účet přihlášeného uživatele i s daty v aplikacích.
 * Bez těla, odpověď 204 a smazaná session cookie.
 */

export function deleteAccount(): Promise<void> {
  return callEndpoint({ method: 'DELETE', path: '/auth/account' });
}
