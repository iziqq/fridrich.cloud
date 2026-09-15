import * as v from 'valibot';
import { emailText, requiredText } from './validation.js';

/** Délka přihlašovacího kódu – stejná hodnota platí na frontendu i backendu. */
export const LOGIN_CODE_LENGTH = 6;

export const DISPLAY_NAME_MAX = 100;

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
  'Vyplňte jméno',
  DISPLAY_NAME_MAX,
  `Jméno může mít nejvýše ${DISPLAY_NAME_MAX} znaků`,
);

/** E-mail účtu – vždy uložený malými písmeny. */
export const AccountEmailSchema = emailText('Zadejte platný e-mail');
