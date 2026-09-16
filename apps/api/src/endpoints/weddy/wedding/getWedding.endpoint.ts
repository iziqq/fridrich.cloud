import { WeddingDetailSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { getWedding } from '../../../application/weddy/wedding.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `GET /api/weddy/weddings/{weddingId}` – detail plánování včetně snoubenců. */

export const GetWeddingParams = v.object({ weddingId: v.string() });
export type GetWeddingParams = v.InferOutput<typeof GetWeddingParams>;

export const GetWeddingResponse = WeddingDetailSchema;
export type GetWeddingResponse = v.InferOutput<typeof GetWeddingResponse>;

export const getWeddingEndpoint = defineEndpoint({
  name: 'getWedding',
  method: 'GET',
  route: 'weddy/weddings/{weddingId}',
  access: 'user',
  params: GetWeddingParams,
  response: GetWeddingResponse,
  async handle({ params, user }) {
    return { status: 200, body: await getWedding(weddyDeps(), params.weddingId, user.id) };
  },
});
