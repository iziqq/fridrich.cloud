import { PlanningBundleInputSchema, PlanningBundleSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `PUT /api/weddy/weddings/{weddingId}/bundles/{bundleId}` – úprava balíčku. */

export const UpdatePlanningBundleRequest = PlanningBundleInputSchema;
export type UpdatePlanningBundleRequest = v.InferInput<typeof UpdatePlanningBundleRequest>;

export const UpdatePlanningBundleResponse = PlanningBundleSchema;
export type UpdatePlanningBundleResponse = v.InferOutput<typeof UpdatePlanningBundleResponse>;

export function updatePlanningBundle(
  weddingId: string,
  bundleId: string,
  request: UpdatePlanningBundleRequest,
): Promise<UpdatePlanningBundleResponse> {
  return callEndpoint({
    method: 'PUT',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/bundles/${encodeURIComponent(bundleId)}`,
    body: { schema: UpdatePlanningBundleRequest, value: request },
    response: UpdatePlanningBundleResponse,
  });
}
