import { PlanningBundleInputSchema, PlanningBundleSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { createBundle } from '../../../application/weddy/planning.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `POST /api/weddy/weddings/{weddingId}/bundles` – nový balíček. */

export const CreatePlanningBundleParams = v.object({ weddingId: v.string() });
export type CreatePlanningBundleParams = v.InferOutput<typeof CreatePlanningBundleParams>;

export const CreatePlanningBundleRequest = PlanningBundleInputSchema;
export type CreatePlanningBundleRequest = v.InferOutput<typeof CreatePlanningBundleRequest>;

export const CreatePlanningBundleResponse = PlanningBundleSchema;
export type CreatePlanningBundleResponse = v.InferOutput<typeof CreatePlanningBundleResponse>;

export const createPlanningBundleEndpoint = defineEndpoint({
  name: 'createPlanningBundle',
  method: 'POST',
  route: 'weddy/weddings/{weddingId}/bundles',
  access: 'user',
  params: CreatePlanningBundleParams,
  body: CreatePlanningBundleRequest,
  response: CreatePlanningBundleResponse,
  async handle({ params, body, user }) {
    return { status: 201, body: await createBundle(weddyDeps(), params.weddingId, body, user.id) };
  },
});
