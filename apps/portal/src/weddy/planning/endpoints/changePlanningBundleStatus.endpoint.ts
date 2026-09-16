import { PlanningBundleSchema, PlanningItemStatusSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/**
 * `PATCH /api/weddy/weddings/{weddingId}/bundles/{bundleId}/status` – přepnutí
 * návrh ↔ schváleno. Stav platí i pro položky balíčku.
 */

export const ChangePlanningBundleStatusRequest = v.object({ status: PlanningItemStatusSchema });
export type ChangePlanningBundleStatusRequest = v.InferInput<
  typeof ChangePlanningBundleStatusRequest
>;

export const ChangePlanningBundleStatusResponse = PlanningBundleSchema;
export type ChangePlanningBundleStatusResponse = v.InferOutput<
  typeof ChangePlanningBundleStatusResponse
>;

export function changePlanningBundleStatus(
  weddingId: string,
  bundleId: string,
  request: ChangePlanningBundleStatusRequest,
): Promise<ChangePlanningBundleStatusResponse> {
  return callEndpoint({
    method: 'PATCH',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/bundles/${encodeURIComponent(bundleId)}/status`,
    body: { schema: ChangePlanningBundleStatusRequest, value: request },
    response: ChangePlanningBundleStatusResponse,
  });
}
