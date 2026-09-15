import { GuestSchema, GuestStatusSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { changeGuestStatus } from '../../../application/weddy/guests.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `PATCH /api/weddy/weddings/{weddingId}/guests/{guestId}/status` – rychlá změna stavu ze seznamu. */

export const ChangeGuestStatusParams = v.object({ weddingId: v.string(), guestId: v.string() });
export type ChangeGuestStatusParams = v.InferOutput<typeof ChangeGuestStatusParams>;

export const ChangeGuestStatusRequest = v.object({ status: GuestStatusSchema });
export type ChangeGuestStatusRequest = v.InferOutput<typeof ChangeGuestStatusRequest>;

export const ChangeGuestStatusResponse = GuestSchema;
export type ChangeGuestStatusResponse = v.InferOutput<typeof ChangeGuestStatusResponse>;

export const changeGuestStatusEndpoint = defineEndpoint({
  name: 'changeGuestStatus',
  method: 'PATCH',
  route: 'weddy/weddings/{weddingId}/guests/{guestId}/status',
  access: 'user',
  params: ChangeGuestStatusParams,
  body: ChangeGuestStatusRequest,
  response: ChangeGuestStatusResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await changeGuestStatus(
        weddyDeps(),
        params.weddingId,
        params.guestId,
        body.status,
        user.id,
      ),
    };
  },
});
