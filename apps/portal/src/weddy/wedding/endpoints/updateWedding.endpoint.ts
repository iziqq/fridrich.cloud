import { WeddingInputSchema, WeddingSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `PUT /api/weddy/weddings/{weddingId}` – úprava názvu, data a snoubenců (obrazovka Snoubenci). */

export const UpdateWeddingRequest = WeddingInputSchema;
export type UpdateWeddingRequest = v.InferInput<typeof UpdateWeddingRequest>;

export const UpdateWeddingResponse = WeddingSchema;
export type UpdateWeddingResponse = v.InferOutput<typeof UpdateWeddingResponse>;

export function updateWedding(
  weddingId: string,
  request: UpdateWeddingRequest,
): Promise<UpdateWeddingResponse> {
  return callEndpoint({
    method: 'PUT',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}`,
    body: { schema: UpdateWeddingRequest, value: request },
    response: UpdateWeddingResponse,
  });
}
