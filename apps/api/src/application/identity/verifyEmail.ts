import { DomainError } from '../../domain/shared/DomainError.js';
import { startSession, type SessionResult } from './session.js';
import type { IdentityDeps } from './deps.js';

export interface VerifyEmailCommand {
  token: string;
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
  const record = await deps.tokens.findByHash(deps.tokenGenerator.hash(command.token));
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
