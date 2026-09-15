import { PlanningItemInputSchema, PlanningItemSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { updateItem } from '../../../application/weddy/planning.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `PUT /api/weddy/weddings/{weddingId}/items/{itemId}` – úprava položky. */

export const UpdatePlanningItemParams = v.object({ weddingId: v.string(), itemId: v.string() });
export type UpdatePlanningItemParams = v.InferOutput<typeof UpdatePlanningItemParams>;

export const UpdatePlanningItemRequest = PlanningItemInputSchema;
export type UpdatePlanningItemRequest = v.InferOutput<typeof UpdatePlanningItemRequest>;

export const UpdatePlanningItemResponse = PlanningItemSchema;
export type UpdatePlanningItemResponse = v.InferOutput<typeof UpdatePlanningItemResponse>;

export const updatePlanningItemEndpoint = defineEndpoint({
  name: 'updatePlanningItem',
  method: 'PUT',
  route: 'weddy/weddings/{weddingId}/items/{itemId}',
  access: 'user',
  params: UpdatePlanningItemParams,
  body: UpdatePlanningItemRequest,
  response: UpdatePlanningItemResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await updateItem(weddyDeps(), params.weddingId, params.itemId, body, user.id),
    };
  },
});
