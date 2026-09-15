import { PlanningItemInputSchema, PlanningItemSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `PUT /api/weddy/weddings/{weddingId}/items/{itemId}` – úprava položky. */

export const UpdatePlanningItemRequest = PlanningItemInputSchema;
export type UpdatePlanningItemRequest = v.InferInput<typeof UpdatePlanningItemRequest>;

export const UpdatePlanningItemResponse = PlanningItemSchema;
export type UpdatePlanningItemResponse = v.InferOutput<typeof UpdatePlanningItemResponse>;

export function updatePlanningItem(
  weddingId: string,
  itemId: string,
  request: UpdatePlanningItemRequest,
): Promise<UpdatePlanningItemResponse> {
  return callEndpoint({
    method: 'PUT',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/items/${encodeURIComponent(itemId)}`,
    body: { schema: UpdatePlanningItemRequest, value: request },
    response: UpdatePlanningItemResponse,
  });
}
