import { PlanningCategorySchema, PlanningItemSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `GET /api/weddy/weddings/{weddingId}/items` – položky plánování, volitelně jedné sekce. */

export const ListPlanningItemsQuery = v.object({
  category: v.optional(PlanningCategorySchema),
});
export type ListPlanningItemsQuery = v.InferInput<typeof ListPlanningItemsQuery>;

export const ListPlanningItemsResponse = v.array(PlanningItemSchema);
export type ListPlanningItemsResponse = v.InferOutput<typeof ListPlanningItemsResponse>;

export function listPlanningItems(
  weddingId: string,
  query: ListPlanningItemsQuery = {},
): Promise<ListPlanningItemsResponse> {
  return callEndpoint({
    method: 'GET',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/items`,
    query,
    response: ListPlanningItemsResponse,
  });
}
