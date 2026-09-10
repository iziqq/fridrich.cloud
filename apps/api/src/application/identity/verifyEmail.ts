import type { User as PublicUser } from '@fridrich/shared';
import { DomainError } from '../../domain/shared/DomainError.js';
import type { IdentityDeps } from './deps.js';

export interface VerifyEmailCommand {
  raw: unknown;
}

/** Ověření e-mailu podle jednorázového tokenu z odkazu. */
export async function verifyEmail(
  deps: IdentityDeps,
  command: VerifyEmailCommand,
): Promise<PublicUser> {
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
  record.consume('emailVerification', deps.clock);

  const user = await deps.users.findById(record.userId);
  if (!user) throw DomainError.notFound('Uživatel');

  user.verifyEmail(deps.clock);

  await deps.users.save(user);
  await deps.tokens.save(record);

  return user.toPublic();
}
