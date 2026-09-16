import { WeddingAccessSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `GET /api/weddy/weddings/{weddingId}/access` – členové a čekající pozvánky. Jen admin. */

export const ListWeddingAccessResponse = WeddingAccessSchema;
export type ListWeddingAccessResponse = v.InferOutput<typeof ListWeddingAccessResponse>;

export function listWeddingAccess(weddingId: string): Promise<ListWeddingAccessResponse> {
  return callEndpoint({
    method: 'GET',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/access`,
    response: ListWeddingAccessResponse,
  });
}
