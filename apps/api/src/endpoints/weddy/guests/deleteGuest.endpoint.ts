import * as v from 'valibot';
import { deleteGuest } from '../../../application/weddy/guests.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `DELETE /api/weddy/weddings/{weddingId}/guests/{guestId}` – smazání hosta. Odpověď 204. */

export const DeleteGuestParams = v.object({ weddingId: v.string(), guestId: v.string() });
export type DeleteGuestParams = v.InferOutput<typeof DeleteGuestParams>;

export const deleteGuestEndpoint = defineEndpoint({
  name: 'deleteGuest',
  method: 'DELETE',
  route: 'weddy/weddings/{weddingId}/guests/{guestId}',
  access: 'user',
  params: DeleteGuestParams,
  async handle({ params, user }) {
    await deleteGuest(weddyDeps(), params.weddingId, params.guestId, user.id);
    return { status: 204 };
  },
});
