import { WeddingAccessSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `DELETE /api/weddy/weddings/{weddingId}/invitations/{invitationId}` – zrušení pozvánky. Jen admin. */

export const CancelWeddingInvitationResponse = WeddingAccessSchema;
export type CancelWeddingInvitationResponse = v.InferOutput<typeof CancelWeddingInvitationResponse>;

export function cancelWeddingInvitation(
  weddingId: string,
  invitationId: string,
): Promise<CancelWeddingInvitationResponse> {
  return callEndpoint({
    method: 'DELETE',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/invitations/${encodeURIComponent(invitationId)}`,
    response: CancelWeddingInvitationResponse,
  });
}
