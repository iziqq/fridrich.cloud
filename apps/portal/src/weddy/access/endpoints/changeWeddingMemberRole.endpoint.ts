import { ChangeWeddingRoleInputSchema, WeddingAccessSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `PATCH /api/weddy/weddings/{weddingId}/access/{memberId}` – změna role člena. Jen admin. */

export const ChangeWeddingMemberRoleRequest = ChangeWeddingRoleInputSchema;
export type ChangeWeddingMemberRoleRequest = v.InferInput<typeof ChangeWeddingMemberRoleRequest>;

export const ChangeWeddingMemberRoleResponse = WeddingAccessSchema;
export type ChangeWeddingMemberRoleResponse = v.InferOutput<typeof ChangeWeddingMemberRoleResponse>;

export function changeWeddingMemberRole(
  weddingId: string,
  memberId: string,
  request: ChangeWeddingMemberRoleRequest,
): Promise<ChangeWeddingMemberRoleResponse> {
  return callEndpoint({
    method: 'PATCH',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/access/${encodeURIComponent(memberId)}`,
    body: { schema: ChangeWeddingMemberRoleRequest, value: request },
    response: ChangeWeddingMemberRoleResponse,
  });
}
