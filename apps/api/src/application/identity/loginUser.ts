import type { User as PublicUser } from '@fridrich/shared';
import { EmailAddress } from '../../domain/identity/EmailAddress.js';
import { Password } from '../../domain/identity/Password.js';
import { Session } from '../../domain/identity/Session.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import type { IdentityDeps } from './deps.js';

export interface LoginCommand {
  raw: unknown;
  sourceIp: string;
}

export interface LoginResult {
  user: PublicUser;
  /** Token do session cookie. V databázi leží jen jeho otisk. */
  sessionToken: string;
  expiresAt: string;
}

/** Stejná hláška pro neznámý e-mail i špatné heslo – nic neprozradí. */
function invalidCredentials(): DomainError {
  return DomainError.unauthorized('Nesprávný e-mail nebo heslo');
}

export async function loginUser(deps: IdentityDeps, command: LoginCommand): Promise<LoginResult> {
  const raw = (typeof command.raw === 'object' && command.raw !== null ? command.raw : {}) as Record<
    string,
    unknown
  >;

  const rawEmail = typeof raw['email'] === 'string' ? raw['email'].trim().toLowerCase() : '';

  // Limit podle IP i podle účtu – jinak by šlo útočit buď plošně z jedné
  // adresy, nebo cíleně na jednu schránku z mnoha adres.
  const [ipAllowed, accountAllowed] = await Promise.all([
    deps.rateLimiter.consume(`login-ip:${command.sourceIp}`, 20, 15 * 60 * 1000),
    deps.rateLimiter.consume(`login-account:${rawEmail}`, 10, 15 * 60 * 1000),
  ]);
  if (!ipAllowed || !accountAllowed) throw DomainError.tooManyRequests();

  let email: EmailAddress;
  let password: Password;
  try {
    email = EmailAddress.create(rawEmail);
    password = Password.forVerification(raw['password']);
  } catch {
    // Nesmyslný vstup vypadá stejně jako špatné údaje.
    throw invalidCredentials();
  }

  const user = await deps.users.findByEmail(email);
  const credentials = user ? await deps.credentials.findByUserId(user.id) : undefined;

  if (!user || !credentials) {
    await deps.hasher.dummyVerify();
    throw invalidCredentials();
  }

  const matches = await credentials.matches(password, deps.hasher);
  if (!matches) throw invalidCredentials();

  // Přihlášení je jediná chvíle, kdy je heslo v ruce – hodí se na tiché
  // přehashování, až parametry zesílíme.
  if (credentials.needsRehash(deps.hasher)) {
    await credentials.changeTo(password, deps.hasher, deps.clock);
    await deps.credentials.save(credentials);
  }

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
