import { PlanningCategorySchema, PlanningItemSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { listItems } from '../../../application/weddy/planning.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `GET /api/weddy/weddings/{weddingId}/items` – položky plánování, volitelně jedné sekce. */

export const ListPlanningItemsParams = v.object({ weddingId: v.string() });
export type ListPlanningItemsParams = v.InferOutput<typeof ListPlanningItemsParams>;

export const ListPlanningItemsQuery = v.object({
  category: v.optional(PlanningCategorySchema),
});
export type ListPlanningItemsQuery = v.InferOutput<typeof ListPlanningItemsQuery>;

export const ListPlanningItemsResponse = v.array(PlanningItemSchema);
export type ListPlanningItemsResponse = v.InferOutput<typeof ListPlanningItemsResponse>;

export const listPlanningItemsEndpoint = defineEndpoint({
  name: 'listPlanningItems',
  method: 'GET',
  route: 'weddy/weddings/{weddingId}/items',
  access: 'user',
  params: ListPlanningItemsParams,
  query: ListPlanningItemsQuery,
  response: ListPlanningItemsResponse,
  async handle({ params, query, user }) {
    return {
      status: 200,
      body: await listItems(weddyDeps(), params.weddingId, user.id, query.category),
    };
  },
});
