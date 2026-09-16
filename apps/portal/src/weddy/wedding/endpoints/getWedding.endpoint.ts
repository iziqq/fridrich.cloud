import { WeddingDetailSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `GET /api/weddy/weddings/{weddingId}` – detail plánování včetně snoubenců. */

export const GetWeddingResponse = WeddingDetailSchema;
export type GetWeddingResponse = v.InferOutput<typeof GetWeddingResponse>;

export function getWedding(weddingId: string): Promise<GetWeddingResponse> {
  return callEndpoint({
    method: 'GET',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}`,
    response: GetWeddingResponse,
  });
}
