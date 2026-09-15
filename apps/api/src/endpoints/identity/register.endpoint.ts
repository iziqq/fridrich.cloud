import {
  AcceptTermsSchema,
  AccountEmailSchema,
  DisplayNameSchema,
  MessageResponseSchema,
} from '@fridrich/shared';
import * as v from 'valibot';
import { registerUser } from '../../application/identity/registerUser.js';
import { getConfig } from '../../config.js';
import { defineEndpoint } from '../../http/endpoint.js';
import { clientIp } from '../../http/responses.js';
import { identityDeps } from '../../infrastructure/container.js';

/** `POST /api/auth/register` – registrace jménem a e-mailem, bez hesla. */

export const RegisterRequest = v.object({
  email: AccountEmailSchema,
  displayName: DisplayNameSchema,
  acceptTerms: AcceptTermsSchema,
});
export type RegisterRequest = v.InferOutput<typeof RegisterRequest>;

export const RegisterResponse = MessageResponseSchema;
export type RegisterResponse = v.InferOutput<typeof RegisterResponse>;

export const registerEndpoint = defineEndpoint({
  name: 'register',
  method: 'POST',
  route: 'auth/register',
  access: 'public',
  body: RegisterRequest,
  response: RegisterResponse,
  async handle({ body, request }) {
    await registerUser(identityDeps(), {
      ...body,
      sourceIp: clientIp(request),
      appUrl: getConfig().appUrl,
    });

    // Odpověď je stejná, ať účet vznikl, nebo byl e-mail už obsazený –
    // jinak by šlo formulářem zjišťovat, kdo je registrovaný.
    return {
      status: 202,
      body: { message: 'Poslali jsme vám e-mail. Otevřením odkazu účet aktivujete.' },
    };
  },
});
