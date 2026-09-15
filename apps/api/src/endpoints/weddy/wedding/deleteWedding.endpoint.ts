import * as v from 'valibot';
import { deleteWedding } from '../../../application/weddy/wedding.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `DELETE /api/weddy/weddings/{weddingId}` – smazání plánování včetně hostů a položek. Odpověď 204. */

export const DeleteWeddingParams = v.object({ weddingId: v.string() });
export type DeleteWeddingParams = v.InferOutput<typeof DeleteWeddingParams>;

export const deleteWeddingEndpoint = defineEndpoint({
  name: 'deleteWedding',
  method: 'DELETE',
  route: 'weddy/weddings/{weddingId}',
  access: 'user',
  params: DeleteWeddingParams,
  async handle({ params, user }) {
    await deleteWedding(weddyDeps(), params.weddingId, user.id);
    return { status: 204 };
  },
});
