import { WeddingAccessSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { removeWeddingMember } from '../../../application/weddy/access.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `DELETE /api/weddy/weddings/{weddingId}/access/{memberId}` – odebrání přístupu. Jen admin. */

export const RemoveWeddingMemberParams = v.object({
  weddingId: v.string(),
  memberId: v.string(),
});
export type RemoveWeddingMemberParams = v.InferOutput<typeof RemoveWeddingMemberParams>;

export const RemoveWeddingMemberResponse = WeddingAccessSchema;
export type RemoveWeddingMemberResponse = v.InferOutput<typeof RemoveWeddingMemberResponse>;

export const removeWeddingMemberEndpoint = defineEndpoint({
  name: 'removeWeddingMember',
  method: 'DELETE',
  route: 'weddy/weddings/{weddingId}/access/{memberId}',
  access: 'user',
  params: RemoveWeddingMemberParams,
  response: RemoveWeddingMemberResponse,
  async handle({ params, user }) {
    return {
      status: 200,
      body: await removeWeddingMember(weddyDeps(), params.weddingId, params.memberId, user.id),
    };
  },
});
