import { WeddingDetailSchema, WeddingInputSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { createWedding } from '../../../application/weddy/wedding.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `POST /api/weddy/weddings` – založení plánování; zakladatel se stane vlastníkem. */

export const CreateWeddingRequest = WeddingInputSchema;
export type CreateWeddingRequest = v.InferOutput<typeof CreateWeddingRequest>;

export const CreateWeddingResponse = WeddingDetailSchema;
export type CreateWeddingResponse = v.InferOutput<typeof CreateWeddingResponse>;

export const createWeddingEndpoint = defineEndpoint({
  name: 'createWedding',
  method: 'POST',
  route: 'weddy/weddings',
  access: 'user',
  body: CreateWeddingRequest,
  response: CreateWeddingResponse,
  async handle({ body, user }) {
    return { status: 201, body: await createWedding(weddyDeps(), body, user.id) };
  },
});
