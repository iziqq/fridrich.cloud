import { AccountEmailSchema, MessageResponseSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { requestLoginCode } from '../../application/identity/login.js';
import { defineEndpoint } from '../../http/endpoint.js';
import { clientIp } from '../../http/responses.js';
import { identityDeps } from '../../infrastructure/container.js';

/** `POST /api/auth/login` – první krok přihlášení: pošle kód na e-mail. */

export const RequestLoginCodeRequest = v.object({
  email: AccountEmailSchema,
});
export type RequestLoginCodeRequest = v.InferOutput<typeof RequestLoginCodeRequest>;

export const RequestLoginCodeResponse = MessageResponseSchema;
export type RequestLoginCodeResponse = v.InferOutput<typeof RequestLoginCodeResponse>;

export const requestLoginCodeEndpoint = defineEndpoint({
  name: 'requestLoginCode',
  method: 'POST',
  route: 'auth/login',
  access: 'public',
  body: RequestLoginCodeRequest,
  response: RequestLoginCodeResponse,
  async handle({ body, request }) {
    await requestLoginCode(identityDeps(), { email: body.email, sourceIp: clientIp(request) });

    // Neprozrazuje, jestli adresa v systému je.
    return {
      status: 202,
      body: { message: 'Pokud účet existuje, poslali jsme na něj přihlašovací kód.' },
    };
  },
});
