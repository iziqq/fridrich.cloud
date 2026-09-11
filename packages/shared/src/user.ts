/**
 * Uživatel tak, jak ho vidí frontend.
 *
 * Nic z bezpečnostní vrstvy sem nepatří – tenhle tvar jde po drátě, takže
 * obsahuje jen to, co smí vidět prohlížeč.
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Registrace: jen jméno a e-mail, ověřovací odkaz přijde do schránky. */
export interface RegisterRequest {
  email: string;
  displayName: string;
}

/** První krok přihlášení – vyžádání kódu na e-mail. */
export interface LoginRequest {
  email: string;
}

/** Druhý krok přihlášení – opsání kódu ze schránky. */
export interface LoginCodeRequest {
  email: string;
  code: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

/** Délka přihlašovacího kódu – stejná hodnota platí na frontendu i backendu. */
export const LOGIN_CODE_LENGTH = 6;
