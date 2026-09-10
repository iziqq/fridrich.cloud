/**
 * Uživatel tak, jak ho vidí frontend.
 *
 * Hash hesla ani nic z bezpečnostní vrstvy sem nepatří – tenhle tvar jde
 * po drátě, takže obsahuje jen to, co smí vidět prohlížeč.
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

/** Minimální délka hesla – stejná hodnota platí na frontendu i backendu. */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;
