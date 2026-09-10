import type { User as PublicUser } from '@fridrich/shared';
import type { User } from '../../domain/identity/User.js';
import type { IdentityDeps } from './deps.js';

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
