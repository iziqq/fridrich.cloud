import { PlanningItemSchema, PlanningItemStatusSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { changeItemStatus } from '../../../application/weddy/planning.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `PATCH /api/weddy/weddings/{weddingId}/items/{itemId}/status` – přepnutí návrh ↔ schváleno. */

export const ChangePlanningItemStatusParams = v.object({
  weddingId: v.string(),
  itemId: v.string(),
});
export type ChangePlanningItemStatusParams = v.InferOutput<typeof ChangePlanningItemStatusParams>;

export const ChangePlanningItemStatusRequest = v.object({ status: PlanningItemStatusSchema });
export type ChangePlanningItemStatusRequest = v.InferOutput<typeof ChangePlanningItemStatusRequest>;

export const ChangePlanningItemStatusResponse = PlanningItemSchema;
export type ChangePlanningItemStatusResponse = v.InferOutput<
  typeof ChangePlanningItemStatusResponse
>;

export const changePlanningItemStatusEndpoint = defineEndpoint({
  name: 'changePlanningItemStatus',
  method: 'PATCH',
  route: 'weddy/weddings/{weddingId}/items/{itemId}/status',
  access: 'user',
  params: ChangePlanningItemStatusParams,
  body: ChangePlanningItemStatusRequest,
  response: ChangePlanningItemStatusResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await changeItemStatus(
        weddyDeps(),
        params.weddingId,
        params.itemId,
        body.status,
        user.id,
      ),
    };
  },
});
