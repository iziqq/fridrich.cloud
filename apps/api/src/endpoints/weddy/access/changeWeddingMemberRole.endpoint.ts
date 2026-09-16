import { ChangeWeddingRoleInputSchema, WeddingAccessSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { changeWeddingMemberRole } from '../../../application/weddy/access.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `PATCH /api/weddy/weddings/{weddingId}/access/{memberId}` – změna role člena. Jen admin. */

export const ChangeWeddingMemberRoleParams = v.object({
  weddingId: v.string(),
  memberId: v.string(),
});
export type ChangeWeddingMemberRoleParams = v.InferOutput<typeof ChangeWeddingMemberRoleParams>;

export const ChangeWeddingMemberRoleRequest = ChangeWeddingRoleInputSchema;
export type ChangeWeddingMemberRoleRequest = v.InferOutput<typeof ChangeWeddingMemberRoleRequest>;

export const ChangeWeddingMemberRoleResponse = WeddingAccessSchema;
export type ChangeWeddingMemberRoleResponse = v.InferOutput<typeof ChangeWeddingMemberRoleResponse>;

export const changeWeddingMemberRoleEndpoint = defineEndpoint({
  name: 'changeWeddingMemberRole',
  method: 'PATCH',
  route: 'weddy/weddings/{weddingId}/access/{memberId}',
  access: 'user',
  params: ChangeWeddingMemberRoleParams,
  body: ChangeWeddingMemberRoleRequest,
  response: ChangeWeddingMemberRoleResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await changeWeddingMemberRole(
        weddyDeps(),
        params.weddingId,
        params.memberId,
        body.role,
        user.id,
      ),
    };
  },
});
