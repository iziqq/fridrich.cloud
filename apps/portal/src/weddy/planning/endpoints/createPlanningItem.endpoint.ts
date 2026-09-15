import { PlanningItemInputSchema, PlanningItemSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/weddy/weddings/{weddingId}/items` – přidání položky do sekce. */

export const CreatePlanningItemRequest = PlanningItemInputSchema;
export type CreatePlanningItemRequest = v.InferInput<typeof CreatePlanningItemRequest>;

export const CreatePlanningItemResponse = PlanningItemSchema;
export type CreatePlanningItemResponse = v.InferOutput<typeof CreatePlanningItemResponse>;

export function createPlanningItem(
  weddingId: string,
  request: CreatePlanningItemRequest,
): Promise<CreatePlanningItemResponse> {
  return callEndpoint({
    method: 'POST',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/items`,
    body: { schema: CreatePlanningItemRequest, value: request },
    response: CreatePlanningItemResponse,
  });
}
