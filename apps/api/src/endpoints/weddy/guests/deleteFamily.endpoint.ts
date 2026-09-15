import * as v from 'valibot';
import { deleteFamily } from '../../../application/weddy/guests.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `DELETE /api/weddy/weddings/{weddingId}/families/{familyId}` – smazání rodiny i všech členů. Odpověď 204. */

export const DeleteFamilyParams = v.object({ weddingId: v.string(), familyId: v.string() });
export type DeleteFamilyParams = v.InferOutput<typeof DeleteFamilyParams>;

export const deleteFamilyEndpoint = defineEndpoint({
  name: 'deleteFamily',
  method: 'DELETE',
  route: 'weddy/weddings/{weddingId}/families/{familyId}',
  access: 'user',
  params: DeleteFamilyParams,
  async handle({ params, user }) {
    await deleteFamily(weddyDeps(), params.weddingId, params.familyId, user.id);
    return { status: 204 };
  },
});
