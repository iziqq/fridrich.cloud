import { WeddingAccessSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { listWeddingAccess } from '../../../application/weddy/access.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `GET /api/weddy/weddings/{weddingId}/access` – členové a čekající pozvánky. Jen admin. */

export const ListWeddingAccessParams = v.object({ weddingId: v.string() });
export type ListWeddingAccessParams = v.InferOutput<typeof ListWeddingAccessParams>;

export const ListWeddingAccessResponse = WeddingAccessSchema;
export type ListWeddingAccessResponse = v.InferOutput<typeof ListWeddingAccessResponse>;

export const listWeddingAccessEndpoint = defineEndpoint({
  name: 'listWeddingAccess',
  method: 'GET',
  route: 'weddy/weddings/{weddingId}/access',
  access: 'user',
  params: ListWeddingAccessParams,
  response: ListWeddingAccessResponse,
  async handle({ params, user }) {
    return { status: 200, body: await listWeddingAccess(weddyDeps(), params.weddingId, user.id) };
  },
});
