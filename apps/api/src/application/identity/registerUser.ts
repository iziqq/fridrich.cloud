import { TERMS_VERSION, type Locale, type User as PublicUser } from '@fridrich/shared';
import { EmailAddress } from '../../domain/identity/EmailAddress.js';
import { OneTimeToken } from '../../domain/identity/OneTimeToken.js';
import { User } from '../../domain/identity/User.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import { accountExistsEmail, verificationEmail } from './emails.js';
import type { IdentityDeps } from './deps.js';

export interface RegisterUserCommand {
  email: string;
  displayName: string;
  /** Souhlas s obchodními podmínkami ve verzi `TERMS_VERSION`. */
  acceptTerms: boolean;
  sourceIp: string;
  /** Základ odkazu v e-mailu, např. `https://www.fridrich.cloud`. */
  appUrl: string;
  /** Jazyk, ve kterém uživatel web používá – účet si ho zapamatuje a v něm přijde e-mail. */
  locale: Locale;
}

/**
 * Registrace nového účtu – jméno a e-mail, žádné heslo.
 *
 * Odpověď je záměrně stejná i pro už obsazený e-mail, jinak by registrační
 * formulář fungoval jako nástroj na zjišťování, kdo je v systému. Rozdíl je
 * jen v tom, co přijde do schránky: buď aktivační odkaz, nebo upozornění,
 * že účet už existuje – a to vidí jenom její majitel.
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

  const email = EmailAddress.create(command.email);

  const existing = await deps.users.findByEmail(email);
  if (existing) {
    // Účet nevzniká, ale volající to nepozná.
    await deps.email.send(
      accountExistsEmail(email.value, `${command.appUrl}/prihlaseni`, command.locale),
    );
    return undefined;
  }

  const user = User.register({
    id: deps.ids.next(),
    email,
    displayName: command.displayName,
    acceptTerms: command.acceptTerms,
    termsVersion: TERMS_VERSION,
    locale: command.locale,
    clock: deps.clock,
  });

  await deps.users.save(user);

  // Co na tuhle adresu čekalo (pozvánka do plánování), teď dostane majitele.
  for (const listener of deps.userRegistrationListeners) {
    await listener.onUserRegistered({ id: user.id, email: email.value });
  }

  await sendVerification(deps, user.id, email.value, command.appUrl, command.locale);

  return user.toPublic();
}

/** Vystaví ověřovací token a pošle aktivační odkaz e-mailem. */
export async function sendVerification(
  deps: IdentityDeps,
  userId: string,
  email: string,
  appUrl: string,
  locale: Locale,
): Promise<void> {
  await deps.tokens.invalidateAll(userId);

  const { token, tokenHash } = deps.tokenGenerator.generate();
  const record = OneTimeToken.issue({
    id: deps.ids.next(),
    tokenHash,
    userId,
    clock: deps.clock,
  });

  await deps.tokens.save(record);

  const verifyUrl = `${appUrl}/overeni-emailu?token=${encodeURIComponent(token)}`;
  await deps.email.send(verificationEmail(email, verifyUrl, locale));
}
