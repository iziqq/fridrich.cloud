import { PlanningBundleSchema, PlanningItemStatusSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { changeBundleStatus } from '../../../application/weddy/planning.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/**
 * `PATCH /api/weddy/weddings/{weddingId}/bundles/{bundleId}/status` – přepnutí
 * návrh ↔ schváleno. Stav platí i pro položky balíčku, nabídka se bere jako celek.
 */

export const ChangePlanningBundleStatusParams = v.object({
  weddingId: v.string(),
  bundleId: v.string(),
});
export type ChangePlanningBundleStatusParams = v.InferOutput<
  typeof ChangePlanningBundleStatusParams
>;

export const ChangePlanningBundleStatusRequest = v.object({ status: PlanningItemStatusSchema });
export type ChangePlanningBundleStatusRequest = v.InferOutput<
  typeof ChangePlanningBundleStatusRequest
>;

export const ChangePlanningBundleStatusResponse = PlanningBundleSchema;
export type ChangePlanningBundleStatusResponse = v.InferOutput<
  typeof ChangePlanningBundleStatusResponse
>;

export const changePlanningBundleStatusEndpoint = defineEndpoint({
  name: 'changePlanningBundleStatus',
  method: 'PATCH',
  route: 'weddy/weddings/{weddingId}/bundles/{bundleId}/status',
  access: 'user',
  params: ChangePlanningBundleStatusParams,
  body: ChangePlanningBundleStatusRequest,
  response: ChangePlanningBundleStatusResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await changeBundleStatus(
        weddyDeps(),
        params.weddingId,
        params.bundleId,
        body.status,
        user.id,
      ),
    };
  },
});
