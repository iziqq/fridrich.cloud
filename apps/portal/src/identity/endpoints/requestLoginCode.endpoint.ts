import { AccountEmailSchema, MessageResponseSchema } from '@fridrich/shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/auth/login` – první krok přihlášení: pošle kód na e-mail. */

export const RequestLoginCodeRequest = v.object({
  email: AccountEmailSchema,
});
export type RequestLoginCodeRequest = v.InferInput<typeof RequestLoginCodeRequest>;

export const RequestLoginCodeResponse = MessageResponseSchema;
export type RequestLoginCodeResponse = v.InferOutput<typeof RequestLoginCodeResponse>;

export function requestLoginCode(
  request: RequestLoginCodeRequest,
): Promise<RequestLoginCodeResponse> {
  return callEndpoint({
    method: 'POST',
    path: '/auth/login',
    body: { schema: RequestLoginCodeRequest, value: request },
    response: RequestLoginCodeResponse,
  });
}
