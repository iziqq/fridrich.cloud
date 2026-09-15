import { PlanningItemInputSchema, PlanningItemSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { createItem } from '../../../application/weddy/planning.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `POST /api/weddy/weddings/{weddingId}/items` – přidání položky do sekce. */

export const CreatePlanningItemParams = v.object({ weddingId: v.string() });
export type CreatePlanningItemParams = v.InferOutput<typeof CreatePlanningItemParams>;

export const CreatePlanningItemRequest = PlanningItemInputSchema;
export type CreatePlanningItemRequest = v.InferOutput<typeof CreatePlanningItemRequest>;

export const CreatePlanningItemResponse = PlanningItemSchema;
export type CreatePlanningItemResponse = v.InferOutput<typeof CreatePlanningItemResponse>;

export const createPlanningItemEndpoint = defineEndpoint({
  name: 'createPlanningItem',
  method: 'POST',
  route: 'weddy/weddings/{weddingId}/items',
  access: 'user',
  params: CreatePlanningItemParams,
  body: CreatePlanningItemRequest,
  response: CreatePlanningItemResponse,
  async handle({ params, body, user }) {
    return { status: 201, body: await createItem(weddyDeps(), params.weddingId, body, user.id) };
  },
});
