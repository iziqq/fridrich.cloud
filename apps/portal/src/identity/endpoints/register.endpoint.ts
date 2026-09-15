import {
  AcceptTermsSchema,
  AccountEmailSchema,
  DisplayNameSchema,
  MessageResponseSchema,
} from '@fridrich/shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/auth/register` – registrace jménem a e-mailem, bez hesla. */

export const RegisterRequest = v.object({
  email: AccountEmailSchema,
  displayName: DisplayNameSchema,
  acceptTerms: AcceptTermsSchema,
});
export type RegisterRequest = v.InferInput<typeof RegisterRequest>;

/** Stejná hláška i pro obsazený e-mail – z odpovědi nejde poznat, kdo je registrovaný. */
export const RegisterResponse = MessageResponseSchema;
export type RegisterResponse = v.InferOutput<typeof RegisterResponse>;

export function register(request: RegisterRequest): Promise<RegisterResponse> {
  return callEndpoint({
    method: 'POST',
    path: '/auth/register',
    body: { schema: RegisterRequest, value: request },
    response: RegisterResponse,
  });
}
