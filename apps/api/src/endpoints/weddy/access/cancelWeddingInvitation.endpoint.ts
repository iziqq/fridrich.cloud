import { WeddingAccessSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { cancelWeddingInvitation } from '../../../application/weddy/access.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `DELETE /api/weddy/weddings/{weddingId}/invitations/{invitationId}` – zrušení pozvánky. Jen admin. */

export const CancelWeddingInvitationParams = v.object({
  weddingId: v.string(),
  invitationId: v.string(),
});
export type CancelWeddingInvitationParams = v.InferOutput<typeof CancelWeddingInvitationParams>;

export const CancelWeddingInvitationResponse = WeddingAccessSchema;
export type CancelWeddingInvitationResponse = v.InferOutput<typeof CancelWeddingInvitationResponse>;

export const cancelWeddingInvitationEndpoint = defineEndpoint({
  name: 'cancelWeddingInvitation',
  method: 'DELETE',
  route: 'weddy/weddings/{weddingId}/invitations/{invitationId}',
  access: 'user',
  params: CancelWeddingInvitationParams,
  response: CancelWeddingInvitationResponse,
  async handle({ params, user }) {
    return {
      status: 200,
      body: await cancelWeddingInvitation(
        weddyDeps(),
        params.weddingId,
        params.invitationId,
        user.id,
      ),
    };
  },
});
