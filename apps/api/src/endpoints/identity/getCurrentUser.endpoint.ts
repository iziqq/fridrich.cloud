import { UserSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { defineEndpoint } from '../../http/endpoint.js';

/** `GET /api/auth/me` – přihlášený uživatel; bez platné session `401`. */

export const GetCurrentUserResponse = UserSchema;
export type GetCurrentUserResponse = v.InferOutput<typeof GetCurrentUserResponse>;

export const getCurrentUserEndpoint = defineEndpoint({
  name: 'getCurrentUser',
  method: 'GET',
  route: 'auth/me',
  access: 'user',
  response: GetCurrentUserResponse,
  async handle({ user }) {
    return { status: 200, body: user.toPublic() };
  },
});
