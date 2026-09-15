import { identityKeys, UserSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { verifyLoginCode } from '../../application/identity/login.js';
import { sessionCookie } from '../../http/cookies.js';
import { defineEndpoint } from '../../http/endpoint.js';
import { clientIp, requestLocale } from '../../http/responses.js';
import { identityDeps } from '../../infrastructure/container.js';

/** `POST /api/auth/login/verify` – druhý krok přihlášení: ověří opsaný kód a založí session. */

/**
 * Schéma je schválně volné – jen řetězce. Neznámý účet, neplatná adresa
 * i špatný kód musí skončit stejnou hláškou, a tu vydává doména.
 */
export const VerifyLoginCodeRequest = v.object({
  email: v.string(identityKeys.emailRequired),
  code: v.string(identityKeys.codeRequired),
});
export type VerifyLoginCodeRequest = v.InferOutput<typeof VerifyLoginCodeRequest>;

export const VerifyLoginCodeResponse = UserSchema;
export type VerifyLoginCodeResponse = v.InferOutput<typeof VerifyLoginCodeResponse>;

export const verifyLoginCodeEndpoint = defineEndpoint({
  name: 'verifyLoginCode',
  method: 'POST',
  route: 'auth/login/verify',
  access: 'public',
  body: VerifyLoginCodeRequest,
  response: VerifyLoginCodeResponse,
  async handle({ body, request }) {
    const result = await verifyLoginCode(identityDeps(), {
      ...body,
      sourceIp: clientIp(request),
      locale: requestLocale(request),
    });

    return {
      status: 200,
      body: result.user,
      headers: { 'Set-Cookie': sessionCookie(result.sessionToken, result.expiresAt) },
    };
  },
});
