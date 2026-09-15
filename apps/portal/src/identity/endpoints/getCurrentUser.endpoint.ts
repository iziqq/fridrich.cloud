import { UserSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `GET /api/auth/me` – přihlášený uživatel; bez platné session `401`. */

export const GetCurrentUserResponse = UserSchema;
export type GetCurrentUserResponse = v.InferOutput<typeof GetCurrentUserResponse>;

export function getCurrentUser(): Promise<GetCurrentUserResponse> {
  return callEndpoint({ method: 'GET', path: '/auth/me', response: GetCurrentUserResponse });
}
