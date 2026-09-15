import { UserSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { verifyEmail } from '../../application/identity/verifyEmail.js';
import { sessionCookie } from '../../http/cookies.js';
import { defineEndpoint } from '../../http/endpoint.js';
import { identityDeps } from '../../infrastructure/container.js';

/** `POST /api/auth/verify-email` – aktivace účtu z odkazu v e-mailu; rovnou přihlásí. */

export const VerifyEmailRequest = v.object({
  token: v.pipe(v.string('Chybí ověřovací token'), v.nonEmpty('Chybí ověřovací token')),
});
export type VerifyEmailRequest = v.InferOutput<typeof VerifyEmailRequest>;

export const VerifyEmailResponse = UserSchema;
export type VerifyEmailResponse = v.InferOutput<typeof VerifyEmailResponse>;

export const verifyEmailEndpoint = defineEndpoint({
  name: 'verifyEmail',
  method: 'POST',
  route: 'auth/verify-email',
  access: 'public',
  body: VerifyEmailRequest,
  response: VerifyEmailResponse,
  async handle({ body }) {
    const result = await verifyEmail(identityDeps(), body);

    return {
      status: 200,
      body: result.user,
      headers: { 'Set-Cookie': sessionCookie(result.sessionToken, result.expiresAt) },
    };
  },
});
