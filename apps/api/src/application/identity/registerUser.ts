import type { User as PublicUser } from '@fridrich/shared';
import { Credentials } from '../../domain/identity/Credentials.js';
import { EmailAddress } from '../../domain/identity/EmailAddress.js';
import { OneTimeToken } from '../../domain/identity/OneTimeToken.js';
import { Password } from '../../domain/identity/Password.js';
import { User } from '../../domain/identity/User.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import { verificationEmail } from './emails.js';
import type { IdentityDeps } from './deps.js';

export interface RegisterUserCommand {
  raw: unknown;
  sourceIp: string;
  /** Základ odkazu v e-mailu, např. `https://www.fridrich.cloud`. */
  appUrl: string;
}

/**
 * Registrace nového účtu.
 *
 * Odpověď je záměrně stejná i pro už obsazený e-mail – jinak by registrační
 * formulář fungoval jako nástroj na zjišťování, kdo je v systému
 * registrovaný. Majitel adresy se o pokusu dozví e-mailem.
 */
export async function registerUser(
  deps: IdentityDeps,
  command: RegisterUserCommand,
): Promise<PublicUser | undefined> {
  const allowed = await deps.rateLimiter.consume(
    `register:${command.sourceIp}`,
    5,
    60 * 60 * 1000,
  );
  if (!allowed) throw DomainError.tooManyRequests();

  const raw = (typeof command.raw === 'object' && command.raw !== null ? command.raw : {}) as Record<
    string,
    unknown
  >;

  const email = EmailAddress.create(raw['email']);
  const password = Password.create(raw['password'], {
    email: email.value,
    displayName: typeof raw['displayName'] === 'string' ? raw['displayName'] : undefined,
  });

  const existing = await deps.users.findByEmail(email);
  if (existing) {
    // Účet nevzniká, ale volající to nepozná.
    return undefined;
  }

  const user = User.register({
    id: deps.ids.next(),
    email,
    displayName: raw['displayName'],
    clock: deps.clock,
  });

  const credentials = await Credentials.create({
    userId: user.id,
    password,
    hasher: deps.hasher,
    clock: deps.clock,
  });

  await deps.users.save(user);
  await deps.credentials.save(credentials);

  await sendVerification(deps, user.id, email.value, command.appUrl);

  return user.toPublic();
}

/** Vystaví ověřovací token a pošle odkaz e-mailem. */
export async function sendVerification(
  deps: IdentityDeps,
  userId: string,
  email: string,
  appUrl: string,
): Promise<void> {
  await deps.tokens.invalidateAll(userId, 'emailVerification');

  const { token, tokenHash } = deps.tokenGenerator.generate();
  const record = OneTimeToken.issue({
    id: deps.ids.next(),
    tokenHash,
    userId,
    purpose: 'emailVerification',
    clock: deps.clock,
  });

  await deps.tokens.save(record);

  const verifyUrl = `${appUrl}/overeni-emailu?token=${encodeURIComponent(token)}`;
  await deps.email.send(verificationEmail(email, verifyUrl));
}
