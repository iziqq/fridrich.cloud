import { callEndpoint } from '@/api/http';

/** `POST /api/auth/logout` – zruší session na serveru a smaže cookie. Bez těla, odpověď 204. */

export function logout(): Promise<void> {
  return callEndpoint({ method: 'POST', path: '/auth/logout' });
}
