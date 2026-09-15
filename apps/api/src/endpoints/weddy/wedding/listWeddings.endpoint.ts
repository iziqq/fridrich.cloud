import { WeddingSummarySchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { listWeddings } from '../../../application/weddy/wedding.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `GET /api/weddy/weddings` – plánování přihlášeného uživatele i se souhrny pro dashboard. */

export const ListWeddingsResponse = v.array(WeddingSummarySchema);
export type ListWeddingsResponse = v.InferOutput<typeof ListWeddingsResponse>;

export const listWeddingsEndpoint = defineEndpoint({
  name: 'listWeddings',
  method: 'GET',
  route: 'weddy/weddings',
  access: 'user',
  response: ListWeddingsResponse,
  async handle({ user }) {
    return { status: 200, body: await listWeddings(weddyDeps(), user.id) };
  },
});
