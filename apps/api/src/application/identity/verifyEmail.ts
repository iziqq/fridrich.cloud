import { DomainError } from '../../domain/shared/DomainError.js';
import { startSession, type SessionResult } from './session.js';
import type { IdentityDeps } from './deps.js';

export interface VerifyEmailCommand {
  raw: unknown;
}

/**
 * Aktivace účtu podle jednorázového tokenu z odkazu.
 *
 * Odkaz rovnou přihlašuje: kdo ho otevřel, prokázal přístup ke schránce a
 * to je v bezheslovém systému jediný důkaz totožnosti, jaký máme. Nutit ho
 * hned nato ještě o kód by nic nepřidalo.
 */
export async function verifyEmail(
  deps: IdentityDeps,
  command: VerifyEmailCommand,
): Promise<SessionResult> {
  const raw = (typeof command.raw === 'object' && command.raw !== null ? command.raw : {}) as Record<
    string,
    unknown
  >;

  const token = raw['token'];
  if (typeof token !== 'string' || token === '') {
    throw DomainError.field('token', 'Chybí ověřovací token');
  }

  const record = await deps.tokens.findByHash(deps.tokenGenerator.hash(token));
  if (!record) {
    throw DomainError.field('token', 'Odkaz už není platný. Vyžádejte si nový.');
  }

  // Domain objekt sám rozhodne, jestli je token použitelný.
  record.consume(deps.clock);

  const user = await deps.users.findById(record.userId);
  if (!user) throw DomainError.notFound('Uživatel');

  user.verifyEmail(deps.clock);

  await deps.users.save(user);
  await deps.tokens.save(record);

  return startSession(deps, user);
}
