import * as v from 'valibot';
import { deleteBundle } from '../../../application/weddy/planning.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/**
 * `DELETE /api/weddy/weddings/{weddingId}/bundles/{bundleId}` – smazání balíčku.
 * Položky zůstávají, jen z něj vypadnou. Odpověď 204.
 */

export const DeletePlanningBundleParams = v.object({
  weddingId: v.string(),
  bundleId: v.string(),
});
export type DeletePlanningBundleParams = v.InferOutput<typeof DeletePlanningBundleParams>;

export const deletePlanningBundleEndpoint = defineEndpoint({
  name: 'deletePlanningBundle',
  method: 'DELETE',
  route: 'weddy/weddings/{weddingId}/bundles/{bundleId}',
  access: 'user',
  params: DeletePlanningBundleParams,
  async handle({ params, user }) {
    await deleteBundle(weddyDeps(), params.weddingId, params.bundleId, user.id);
    return { status: 204 };
  },
});
