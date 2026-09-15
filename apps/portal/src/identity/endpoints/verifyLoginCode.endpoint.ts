import { UserSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/auth/login/verify` – druhý krok přihlášení: ověří opsaný kód a založí session. */

/** Volné schéma – neplatný kód i neznámý účet hlásí backend stejnou chybou u pole `code`. */
export const VerifyLoginCodeRequest = v.object({
  email: v.string('Zadejte e-mail'),
  code: v.string('Zadejte kód z e-mailu'),
});
export type VerifyLoginCodeRequest = v.InferInput<typeof VerifyLoginCodeRequest>;

export const VerifyLoginCodeResponse = UserSchema;
export type VerifyLoginCodeResponse = v.InferOutput<typeof VerifyLoginCodeResponse>;

export function verifyLoginCode(request: VerifyLoginCodeRequest): Promise<VerifyLoginCodeResponse> {
  return callEndpoint({
    method: 'POST',
    path: '/auth/login/verify',
    body: { schema: VerifyLoginCodeRequest, value: request },
    response: VerifyLoginCodeResponse,
  });
}
