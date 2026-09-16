import { PlanningBundleInputSchema, PlanningBundleSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/weddy/weddings/{weddingId}/bundles` – nový balíček. */

export const CreatePlanningBundleRequest = PlanningBundleInputSchema;
export type CreatePlanningBundleRequest = v.InferInput<typeof CreatePlanningBundleRequest>;

export const CreatePlanningBundleResponse = PlanningBundleSchema;
export type CreatePlanningBundleResponse = v.InferOutput<typeof CreatePlanningBundleResponse>;

export function createPlanningBundle(
  weddingId: string,
  request: CreatePlanningBundleRequest,
): Promise<CreatePlanningBundleResponse> {
  return callEndpoint({
    method: 'POST',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/bundles`,
    body: { schema: CreatePlanningBundleRequest, value: request },
    response: CreatePlanningBundleResponse,
  });
}
