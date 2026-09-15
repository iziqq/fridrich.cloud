import type { User as PublicUser } from '@fridrich/shared';
import { Session } from '../../domain/identity/Session.js';
import type { User } from '../../domain/identity/User.js';
import type { IdentityDeps } from './deps.js';

export interface SessionResult {
  user: PublicUser;
  /** Token do session cookie. V databázi leží jen jeho otisk. */
  sessionToken: string;
  expiresAt: string;
}

/**
 * Založí přihlášení.
 *
 * Volají to dvě cesty – opsaný kód i kliknutí na aktivační odkaz – a obě
 * musí session vyrobit stejně, proto sedí na jednom místě.
 */
export async function startSession(deps: IdentityDeps, user: User): Promise<SessionResult> {
  // Přihlášení je aktivita – odsouvá smazání neaktivního účtu.
  if (user.markSeen(deps.clock)) await deps.users.save(user);

  const { token, tokenHash } = deps.tokenGenerator.generate();
  const session = Session.start({
    id: deps.ids.next(),
    tokenHash,
    userId: user.id,
    clock: deps.clock,
  });

  await deps.sessions.save(session);

  return { user: user.toPublic(), sessionToken: token, expiresAt: session.expiresAt };
}

/**
 * Přeloží token ze session cookie na přihlášeného uživatele.
 *
 * Vrací `undefined` místo výjimky – volající vrstva sama rozhodne, jestli je
 * nepřihlášený uživatel chyba (chráněný endpoint), nebo běžný stav (`/me`).
 */
export async function resolveSession(
  deps: IdentityDeps,
  sessionToken: string | undefined,
): Promise<User | undefined> {
  if (!sessionToken) return undefined;

  const session = await deps.sessions.findByHash(deps.tokenGenerator.hash(sessionToken));
  if (!session) return undefined;

  if (session.isExpired(deps.clock)) {
    await deps.sessions.delete(session.id, session.userId);
    return undefined;
  }

  const user = await deps.users.findById(session.userId);
  if (!user) {
    // Uživatel zmizel, session je bezcenná.
    await deps.sessions.delete(session.id, session.userId);
    return undefined;
  }

  // Platnost se posouvá jen jednou za den, ne při každém požadavku.
  if (session.touch(deps.clock)) {
    await deps.sessions.save(session);
  }

  // Používání přihlášeného účtu je aktivita stejně jako přihlášení (zápis nejvýš jednou za den).
  if (user.markSeen(deps.clock)) {
    await deps.users.save(user);
  }

  return user;
}

export async function logout(deps: IdentityDeps, sessionToken: string | undefined): Promise<void> {
  if (!sessionToken) return;

  const session = await deps.sessions.findByHash(deps.tokenGenerator.hash(sessionToken));
  if (!session) return;

  await deps.sessions.delete(session.id, session.userId);
}

export function toPublicUser(user: User): PublicUser {
  return user.toPublic();
}
