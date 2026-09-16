import { WeddingAccessSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `DELETE /api/weddy/weddings/{weddingId}/access/{memberId}` – odebrání přístupu. Jen admin. */

export const RemoveWeddingMemberResponse = WeddingAccessSchema;
export type RemoveWeddingMemberResponse = v.InferOutput<typeof RemoveWeddingMemberResponse>;

export function removeWeddingMember(
  weddingId: string,
  memberId: string,
): Promise<RemoveWeddingMemberResponse> {
  return callEndpoint({
    method: 'DELETE',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/access/${encodeURIComponent(memberId)}`,
    response: RemoveWeddingMemberResponse,
  });
}
