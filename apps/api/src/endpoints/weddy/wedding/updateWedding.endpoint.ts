import { WeddingInputSchema, WeddingSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { updateWedding } from '../../../application/weddy/wedding.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `PUT /api/weddy/weddings/{weddingId}` – úprava názvu, data a snoubenců (obrazovka Snoubenci). */

export const UpdateWeddingParams = v.object({ weddingId: v.string() });
export type UpdateWeddingParams = v.InferOutput<typeof UpdateWeddingParams>;

export const UpdateWeddingRequest = WeddingInputSchema;
export type UpdateWeddingRequest = v.InferOutput<typeof UpdateWeddingRequest>;

export const UpdateWeddingResponse = WeddingSchema;
export type UpdateWeddingResponse = v.InferOutput<typeof UpdateWeddingResponse>;

export const updateWeddingEndpoint = defineEndpoint({
  name: 'updateWedding',
  method: 'PUT',
  route: 'weddy/weddings/{weddingId}',
  access: 'user',
  params: UpdateWeddingParams,
  body: UpdateWeddingRequest,
  response: UpdateWeddingResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await updateWedding(weddyDeps(), params.weddingId, body, user.id),
    };
  },
});
