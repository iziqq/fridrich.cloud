import { UserSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/auth/verify-email` – aktivace účtu z odkazu v e-mailu; rovnou přihlásí. */

export const VerifyEmailRequest = v.object({
  token: v.pipe(v.string('Chybí ověřovací token'), v.nonEmpty('Chybí ověřovací token')),
});
export type VerifyEmailRequest = v.InferInput<typeof VerifyEmailRequest>;

export const VerifyEmailResponse = UserSchema;
export type VerifyEmailResponse = v.InferOutput<typeof VerifyEmailResponse>;

export function verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
  return callEndpoint({
    method: 'POST',
    path: '/auth/verify-email',
    body: { schema: VerifyEmailRequest, value: request },
    response: VerifyEmailResponse,
  });
}
