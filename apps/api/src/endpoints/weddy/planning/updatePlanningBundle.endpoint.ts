import { PlanningBundleInputSchema, PlanningBundleSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { updateBundle } from '../../../application/weddy/planning.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `PUT /api/weddy/weddings/{weddingId}/bundles/{bundleId}` – úprava balíčku. */

export const UpdatePlanningBundleParams = v.object({
  weddingId: v.string(),
  bundleId: v.string(),
});
export type UpdatePlanningBundleParams = v.InferOutput<typeof UpdatePlanningBundleParams>;

export const UpdatePlanningBundleRequest = PlanningBundleInputSchema;
export type UpdatePlanningBundleRequest = v.InferOutput<typeof UpdatePlanningBundleRequest>;

export const UpdatePlanningBundleResponse = PlanningBundleSchema;
export type UpdatePlanningBundleResponse = v.InferOutput<typeof UpdatePlanningBundleResponse>;

export const updatePlanningBundleEndpoint = defineEndpoint({
  name: 'updatePlanningBundle',
  method: 'PUT',
  route: 'weddy/weddings/{weddingId}/bundles/{bundleId}',
  access: 'user',
  params: UpdatePlanningBundleParams,
  body: UpdatePlanningBundleRequest,
  response: UpdatePlanningBundleResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await updateBundle(weddyDeps(), params.weddingId, params.bundleId, body, user.id),
    };
  },
});
