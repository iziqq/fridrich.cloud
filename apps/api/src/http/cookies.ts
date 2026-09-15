import type { HttpRequest } from '@azure/functions';
import { getConfig } from '../config.js';

export const SESSION_COOKIE = 'fc_session';

/** Vytáhne hodnotu cookie z hlavičky `Cookie`. */
export function readCookie(request: HttpRequest, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;

    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }

  return undefined;
}

export function readSessionToken(request: HttpRequest): string | undefined {
  return readCookie(request, SESSION_COOKIE);
}

/**
 * Cookie s přihlášením.
 *
 * `HttpOnly` ji schová před JavaScriptem, takže ji neukradne XSS.
 * `SameSite=Lax` brání odeslání při cizím POSTu (CSRF), ale nechá projít
 * běžnou navigaci. `Domain` se nastavuje jen při vyplněném `COOKIE_DOMAIN` –
 * web, produkty i API jsou na jednom originu, takže cookie platí všude sama
 * (doc/wiki/domains/identity.md).
 */
export function sessionCookie(token: string, expiresAt: string): string {
  const config = getConfig();
  const maxAge = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );

  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];

  if (config.cookieDomain) parts.push(`Domain=${config.cookieDomain}`);
  // Bez HTTPS by prohlížeč Secure cookie na localhostu zahodil.
  if (config.isProduction) parts.push('Secure');

  return parts.join('; ');
}

/** Cookie, která okamžitě vyprší – používá se při odhlášení. */
export function clearedSessionCookie(): string {
  const config = getConfig();

  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];

  if (config.cookieDomain) parts.push(`Domain=${config.cookieDomain}`);
  if (config.isProduction) parts.push('Secure');

  return parts.join('; ');
}
