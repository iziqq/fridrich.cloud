import { identityKeys, type Locale } from '@fridrich/shared';
import { DomainError } from '../../domain/shared/DomainError.js';
import { startSession, type SessionResult } from './session.js';
import type { IdentityDeps } from './deps.js';

export interface VerifyEmailCommand {
  token: string;
  /** Jazyk požadavku – po aktivaci se uloží k účtu. */
  locale: Locale;
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
    throw DomainError.field('token', identityKeys.linkInvalid);
  }

  // Domain objekt sám rozhodne, jestli je token použitelný.
  record.consume(deps.clock);

  const user = await deps.users.findById(record.userId);
  if (!user) throw DomainError.notFound(identityKeys.accountNotFound);

  user.verifyEmail(deps.clock);

  await deps.users.save(user);
  await deps.tokens.save(record);

  return startSession(deps, user, command.locale);
}
