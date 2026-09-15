import { WeddingInputSchema, WeddingSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/weddy/weddings` – založení plánování. */

export const CreateWeddingRequest = WeddingInputSchema;
export type CreateWeddingRequest = v.InferInput<typeof CreateWeddingRequest>;

export const CreateWeddingResponse = WeddingSchema;
export type CreateWeddingResponse = v.InferOutput<typeof CreateWeddingResponse>;

export function createWedding(request: CreateWeddingRequest): Promise<CreateWeddingResponse> {
  return callEndpoint({
    method: 'POST',
    path: '/weddy/weddings',
    body: { schema: CreateWeddingRequest, value: request },
    response: CreateWeddingResponse,
  });
}
