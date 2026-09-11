import { EmailAddress } from '../../domain/identity/EmailAddress.js';
import { LoginCode, LOGIN_CODE_LIFETIME_MS } from '../../domain/identity/LoginCode.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import { loginCodeEmail } from './emails.js';
import { startSession, type SessionResult } from './session.js';
import type { IdentityDeps } from './deps.js';

export interface RequestLoginCodeCommand {
  raw: unknown;
  sourceIp: string;
}

/**
 * První krok přihlášení – pošle na e-mail šestimístný kód.
 *
 * Nevrací nic a nikdy nehlásí, že adresa neexistuje: jinak by formulář
 * fungoval jako seznam registrovaných e-mailů. Limit na adresu je tu i
 * proto, aby se přes cizí schránku nedalo posílat desítky zpráv.
 */
export async function requestLoginCode(
  deps: IdentityDeps,
  command: RequestLoginCodeCommand,
): Promise<void> {
  const raw = (typeof command.raw === 'object' && command.raw !== null ? command.raw : {}) as Record<
    string,
    unknown
  >;

  const rawEmail = typeof raw['email'] === 'string' ? raw['email'].trim().toLowerCase() : '';

  const [ipAllowed, accountAllowed] = await Promise.all([
    deps.rateLimiter.consume(`login-request-ip:${command.sourceIp}`, 20, 60 * 60 * 1000),
    deps.rateLimiter.consume(`login-request-account:${rawEmail}`, 5, 60 * 60 * 1000),
  ]);
  if (!ipAllowed || !accountAllowed) throw DomainError.tooManyRequests();

  let email: EmailAddress;
  try {
    email = EmailAddress.create(rawEmail);
  } catch {
    return; // neplatný tvar adresy – mlčky končíme
  }

  const user = await deps.users.findByEmail(email);
  if (!user) return;

  // Starší kód přestane platit, ať nemá uživatel ve schránce dva platné.
  await deps.loginCodes.deleteAllForUser(user.id);

  const { challenge, code } = LoginCode.issue({
    id: deps.ids.next(),
    userId: user.id,
    generator: deps.tokenGenerator,
    clock: deps.clock,
  });

  await deps.loginCodes.save(challenge);

  await deps.email.send(
    loginCodeEmail(email.value, code, Math.round(LOGIN_CODE_LIFETIME_MS / 60_000)),
  );
}

export interface VerifyLoginCodeCommand {
  raw: unknown;
  sourceIp: string;
}

/** Stejná hláška pro neznámý účet, chybějící i špatný kód – nic neprozradí. */
function rejected(): DomainError {
  return DomainError.field('code', 'Kód není platný. Vyžádejte si nový.');
}

/**
 * Druhý krok přihlášení – ověří opsaný kód a založí session.
 *
 * Úspěch zároveň znamená, že uživatel prokázal přístup ke schránce, takže
 * se tím rovnou ověří i e-mail. Účet založený přes registraci se dá takhle
 * aktivovat i bez kliknutí na odkaz.
 */
export async function verifyLoginCode(
  deps: IdentityDeps,
  command: VerifyLoginCodeCommand,
): Promise<SessionResult> {
  const allowed = await deps.rateLimiter.consume(
    `login-verify-ip:${command.sourceIp}`,
    20,
    15 * 60 * 1000,
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
    throw rejected();
  }

  const user = await deps.users.findByEmail(email);
  const challenge = user ? await deps.loginCodes.findForUser(user.id) : undefined;
  if (!user || !challenge) throw rejected();

  try {
    challenge.verify(raw['code'], deps.tokenGenerator, deps.clock);
  } catch (error) {
    // Počítadlo pokusů zvedla doména; bez uložení by hádání kódu nic nestálo.
    await deps.loginCodes.save(challenge);
    throw error;
  }

  // Kód je jednorázový – druhé použití už nesmí projít.
  await deps.loginCodes.deleteAllForUser(user.id);

  if (!user.emailVerified) {
    user.verifyEmail(deps.clock);
    await deps.users.save(user);
  }

  return startSession(deps, user);
}
