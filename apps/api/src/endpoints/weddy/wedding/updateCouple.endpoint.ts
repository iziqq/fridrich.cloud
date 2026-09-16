import { CoupleInputSchema, WeddingDetailSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { updateCouple } from '../../../application/weddy/wedding.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `PUT /api/weddy/weddings/{weddingId}/couple` – údaje o snoubencích. Smí admin i manager. */

export const UpdateCoupleParams = v.object({ weddingId: v.string() });
export type UpdateCoupleParams = v.InferOutput<typeof UpdateCoupleParams>;

export const UpdateCoupleRequest = CoupleInputSchema;
export type UpdateCoupleRequest = v.InferOutput<typeof UpdateCoupleRequest>;

export const UpdateCoupleResponse = WeddingDetailSchema;
export type UpdateCoupleResponse = v.InferOutput<typeof UpdateCoupleResponse>;

export const updateCoupleEndpoint = defineEndpoint({
  name: 'updateCouple',
  method: 'PUT',
  route: 'weddy/weddings/{weddingId}/couple',
  access: 'user',
  params: UpdateCoupleParams,
  body: UpdateCoupleRequest,
  response: UpdateCoupleResponse,
  async handle({ params, body, user }) {
    return { status: 200, body: await updateCouple(weddyDeps(), params.weddingId, body, user.id) };
  },
});
