import { WeddingSummarySchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `GET /api/weddy/weddings` – plánování přihlášeného uživatele i se souhrny pro dashboard. */

export const ListWeddingsResponse = v.array(WeddingSummarySchema);
export type ListWeddingsResponse = v.InferOutput<typeof ListWeddingsResponse>;

export function listWeddings(): Promise<ListWeddingsResponse> {
  return callEndpoint({ method: 'GET', path: '/weddy/weddings', response: ListWeddingsResponse });
}
