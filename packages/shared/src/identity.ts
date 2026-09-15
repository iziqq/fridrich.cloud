import * as v from 'valibot';
import { messageKeys, type Catalog } from './i18n.js';
import { emailText, requiredText } from './validation.js';

/** Délka přihlašovacího kódu – stejná hodnota platí na frontendu i backendu. */
export const LOGIN_CODE_LENGTH = 6;

export const DISPLAY_NAME_MAX = 100;

const cs = {
  displayNameRequired: 'Vyplňte jméno',
  displayNameTooLong: `Jméno může mít nejvýše ${DISPLAY_NAME_MAX} znaků`,
  emailInvalid: 'Zadejte platný e-mail',
  emailRequired: 'Zadejte e-mail',
  codeRequired: 'Zadejte kód z e-mailu',
  codeInvalid: 'Kód není platný. Vyžádejte si nový.',
  linkInvalid: 'Odkaz už není platný. Vyžádejte si nový.',
  tokenMissing: 'Chybí ověřovací token',
  acceptTermsRequired: 'Pro založení účtu je potřeba souhlasit s obchodními podmínkami',
  accountNotFound: 'Účet neexistuje',
  registerSent: 'Poslali jsme vám e-mail. Otevřením odkazu účet aktivujete.',
  loginCodeSent: 'Pokud účet existuje, poslali jsme na něj přihlašovací kód.',
};

const en: Catalog<typeof cs> = {
  displayNameRequired: 'Please enter your name',
  displayNameTooLong: `The name can have at most ${DISPLAY_NAME_MAX} characters`,
  emailInvalid: 'Please enter a valid e-mail',
  emailRequired: 'Please enter your e-mail',
  codeRequired: 'Please enter the code from the e-mail',
  codeInvalid: 'The code is not valid. Request a new one.',
  linkInvalid: 'The link is no longer valid. Request a new one.',
  tokenMissing: 'The verification token is missing',
  acceptTermsRequired: 'You need to accept the terms and conditions to create an account',
  accountNotFound: 'The account does not exist',
  registerSent: 'We have sent you an e-mail. Open the link to activate your account.',
  loginCodeSent: 'If the account exists, we have sent a sign-in code to it.',
};

/** Hlášky identity – jmenný prostor `shared.identity`. */
export const identityMessages = { cs, en };
export const identityKeys = messageKeys(cs, 'shared.identity');

/**
 * Uživatel tak, jak ho vidí frontend.
 *
 * Nic z bezpečnostní vrstvy sem nepatří – tenhle tvar jde po drátě, takže
 * obsahuje jen to, co smí vidět prohlížeč.
 */
export const UserSchema = v.object({
  id: v.string(),
  email: v.string(),
  displayName: v.string(),
  emailVerified: v.boolean(),
  createdAt: v.string(),
  updatedAt: v.string(),
});
export type User = v.InferOutput<typeof UserSchema>;

/** Jméno uživatele při registraci. */
export const DisplayNameSchema = requiredText(
  identityKeys.displayNameRequired,
  DISPLAY_NAME_MAX,
  identityKeys.displayNameTooLong,
);

/** E-mail účtu – vždy uložený malými písmeny. */
export const AccountEmailSchema = emailText(identityKeys.emailInvalid);

/** Souhlas s obchodními podmínkami při registraci – bez něj účet nevznikne. */
export const AcceptTermsSchema = v.literal(true, identityKeys.acceptTermsRequired);
