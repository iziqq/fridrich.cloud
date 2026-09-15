import { GuestInputSchema, GuestSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { updateGuest } from '../../../application/weddy/guests.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `PUT /api/weddy/weddings/{weddingId}/guests/{guestId}` – úprava hosta; z rodiny ho nevyřadí. */

export const UpdateGuestParams = v.object({ weddingId: v.string(), guestId: v.string() });
export type UpdateGuestParams = v.InferOutput<typeof UpdateGuestParams>;

export const UpdateGuestRequest = GuestInputSchema;
export type UpdateGuestRequest = v.InferOutput<typeof UpdateGuestRequest>;

export const UpdateGuestResponse = GuestSchema;
export type UpdateGuestResponse = v.InferOutput<typeof UpdateGuestResponse>;

export const updateGuestEndpoint = defineEndpoint({
  name: 'updateGuest',
  method: 'PUT',
  route: 'weddy/weddings/{weddingId}/guests/{guestId}',
  access: 'user',
  params: UpdateGuestParams,
  body: UpdateGuestRequest,
  response: UpdateGuestResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await updateGuest(weddyDeps(), params.weddingId, params.guestId, body, user.id),
    };
  },
});
