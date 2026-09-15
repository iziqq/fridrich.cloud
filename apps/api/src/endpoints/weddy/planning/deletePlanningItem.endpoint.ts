import * as v from 'valibot';
import { deleteItem } from '../../../application/weddy/planning.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `DELETE /api/weddy/weddings/{weddingId}/items/{itemId}` – smazání položky. Odpověď 204. */

export const DeletePlanningItemParams = v.object({ weddingId: v.string(), itemId: v.string() });
export type DeletePlanningItemParams = v.InferOutput<typeof DeletePlanningItemParams>;

export const deletePlanningItemEndpoint = defineEndpoint({
  name: 'deletePlanningItem',
  method: 'DELETE',
  route: 'weddy/weddings/{weddingId}/items/{itemId}',
  access: 'user',
  params: DeletePlanningItemParams,
  async handle({ params, user }) {
    await deleteItem(weddyDeps(), params.weddingId, params.itemId, user.id);
    return { status: 204 };
  },
});
