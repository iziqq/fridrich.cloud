import { EmailAddress } from '../../domain/identity/EmailAddress.js';
import { OneTimeToken } from '../../domain/identity/OneTimeToken.js';
import { Password } from '../../domain/identity/Password.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import { passwordChangedEmail, passwordResetEmail } from './emails.js';
import type { IdentityDeps } from './deps.js';

export interface ForgotPasswordCommand {
  raw: unknown;
  sourceIp: string;
  appUrl: string;
}

/**
 * Žádost o obnovu hesla.
 *
 * Nevrací nic a nikdy nehlásí, že adresa neexistuje – jinak by formulář
 * fungoval jako seznam registrovaných e-mailů.
 */
export async function requestPasswordReset(
  deps: IdentityDeps,
  command: ForgotPasswordCommand,
): Promise<void> {
  const allowed = await deps.rateLimiter.consume(
    `forgot:${command.sourceIp}`,
    5,
    60 * 60 * 1000,
  );
  if (!allowed) throw DomainError.tooManyRequests();

  const raw = (typeof command.raw === 'object' && command.raw !== null ? command.raw : {}) as Record<
    string,
    unknown
  >;

  let email: EmailAddress;
  try {
    email = EmailAddress.create(raw['email']);
  } catch {
    return; // neplatný tvar adresy – mlčky končíme
  }

  const user = await deps.users.findByEmail(email);
  if (!user) return;

  // Starší odkazy přestanou platit, ať v e-mailu nezůstane použitelný token.
  await deps.tokens.invalidateAll(user.id, 'passwordReset');

  const { token, tokenHash } = deps.tokenGenerator.generate();
  const record = OneTimeToken.issue({
    id: deps.ids.next(),
    tokenHash,
    userId: user.id,
    purpose: 'passwordReset',
    clock: deps.clock,
  });

  await deps.tokens.save(record);

  const resetUrl = `${command.appUrl}/obnova-hesla?token=${encodeURIComponent(token)}`;
  await deps.email.send(passwordResetEmail(email.value, resetUrl));
}

export interface ResetPasswordCommand {
  raw: unknown;
  appUrl: string;
}

/** Nastavení nového hesla podle tokenu z e-mailu. */
export async function resetPassword(
  deps: IdentityDeps,
  command: ResetPasswordCommand,
): Promise<void> {
  const raw = (typeof command.raw === 'object' && command.raw !== null ? command.raw : {}) as Record<
    string,
    unknown
  >;

  const token = raw['token'];
  if (typeof token !== 'string' || token === '') {
    throw DomainError.field('token', 'Chybí token pro obnovu hesla');
  }

  const record = await deps.tokens.findByHash(deps.tokenGenerator.hash(token));
  if (!record) {
    throw DomainError.field('token', 'Odkaz už není platný. Vyžádejte si nový.');
  }

  const user = await deps.users.findById(record.userId);
  if (!user) throw DomainError.notFound('Uživatel');

  const password = Password.create(raw['password'], {
    email: user.email.value,
    displayName: user.displayName,
  });

  record.consume('passwordReset', deps.clock);

  const credentials = await deps.credentials.findByUserId(user.id);
  if (!credentials) throw DomainError.notFound('Uživatel');

  await credentials.changeTo(password, deps.hasher, deps.clock);

  await deps.credentials.save(credentials);
  await deps.tokens.save(record);

  // Kdo si mění heslo, obvykle řeší, že mu někdo mohl vlézt do účtu.
  // Odhlášení všude jinde je tedy součást akce, ne volitelný bonus.
  await deps.sessions.deleteAllForUser(user.id);

  // Ověřený e-mail je vedlejší produkt – klikl na odkaz, který tam přišel.
  if (!user.emailVerified) {
    user.verifyEmail(deps.clock);
    await deps.users.save(user);
  }

  await deps.email.send(
    passwordChangedEmail(user.email.value, `${command.appUrl}/prihlaseni`),
  );
}
