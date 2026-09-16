import { CoupleInputSchema, WeddingDetailSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `PUT /api/weddy/weddings/{weddingId}/couple` – údaje o snoubencích. Smí admin i manager. */

export const UpdateCoupleRequest = CoupleInputSchema;
export type UpdateCoupleRequest = v.InferInput<typeof UpdateCoupleRequest>;

export const UpdateCoupleResponse = WeddingDetailSchema;
export type UpdateCoupleResponse = v.InferOutput<typeof UpdateCoupleResponse>;

export function updateCouple(
  weddingId: string,
  request: UpdateCoupleRequest,
): Promise<UpdateCoupleResponse> {
  return callEndpoint({
    method: 'PUT',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/couple`,
    body: { schema: UpdateCoupleRequest, value: request },
    response: UpdateCoupleResponse,
  });
}
