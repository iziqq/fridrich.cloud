import { PlanningItemSchema, PlanningItemStatusSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `PATCH /api/weddy/weddings/{weddingId}/items/{itemId}/status` – přepnutí návrh ↔ schváleno. */

export const ChangePlanningItemStatusRequest = v.object({ status: PlanningItemStatusSchema });
export type ChangePlanningItemStatusRequest = v.InferInput<typeof ChangePlanningItemStatusRequest>;

export const ChangePlanningItemStatusResponse = PlanningItemSchema;
export type ChangePlanningItemStatusResponse = v.InferOutput<
  typeof ChangePlanningItemStatusResponse
>;

export function changePlanningItemStatus(
  weddingId: string,
  itemId: string,
  request: ChangePlanningItemStatusRequest,
): Promise<ChangePlanningItemStatusResponse> {
  return callEndpoint({
    method: 'PATCH',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/items/${encodeURIComponent(itemId)}/status`,
    body: { schema: ChangePlanningItemStatusRequest, value: request },
    response: ChangePlanningItemStatusResponse,
  });
}
