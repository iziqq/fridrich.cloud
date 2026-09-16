import { PlanningBundleSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { listBundles } from '../../../application/weddy/planning.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `GET /api/weddy/weddings/{weddingId}/bundles` – balíčky jednoho plánování. */

export const ListPlanningBundlesParams = v.object({ weddingId: v.string() });
export type ListPlanningBundlesParams = v.InferOutput<typeof ListPlanningBundlesParams>;

export const ListPlanningBundlesResponse = v.array(PlanningBundleSchema);
export type ListPlanningBundlesResponse = v.InferOutput<typeof ListPlanningBundlesResponse>;

export const listPlanningBundlesEndpoint = defineEndpoint({
  name: 'listPlanningBundles',
  method: 'GET',
  route: 'weddy/weddings/{weddingId}/bundles',
  access: 'user',
  params: ListPlanningBundlesParams,
  response: ListPlanningBundlesResponse,
  async handle({ params, user }) {
    return { status: 200, body: await listBundles(weddyDeps(), params.weddingId, user.id) };
  },
});
