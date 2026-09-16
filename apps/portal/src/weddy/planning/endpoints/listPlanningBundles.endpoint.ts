import { PlanningBundleSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `GET /api/weddy/weddings/{weddingId}/bundles` – balíčky jednoho plánování. */

export const ListPlanningBundlesResponse = v.array(PlanningBundleSchema);
export type ListPlanningBundlesResponse = v.InferOutput<typeof ListPlanningBundlesResponse>;

export function listPlanningBundles(weddingId: string): Promise<ListPlanningBundlesResponse> {
  return callEndpoint({
    method: 'GET',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/bundles`,
    response: ListPlanningBundlesResponse,
  });
}
