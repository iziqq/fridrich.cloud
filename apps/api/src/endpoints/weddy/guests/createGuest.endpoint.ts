import { GuestInputSchema, GuestSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { createGuest } from '../../../application/weddy/guests.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `POST /api/weddy/weddings/{weddingId}/guests` – přidání hosta. */

export const CreateGuestParams = v.object({ weddingId: v.string() });
export type CreateGuestParams = v.InferOutput<typeof CreateGuestParams>;

export const CreateGuestRequest = GuestInputSchema;
export type CreateGuestRequest = v.InferOutput<typeof CreateGuestRequest>;

export const CreateGuestResponse = GuestSchema;
export type CreateGuestResponse = v.InferOutput<typeof CreateGuestResponse>;

export const createGuestEndpoint = defineEndpoint({
  name: 'createGuest',
  method: 'POST',
  route: 'weddy/weddings/{weddingId}/guests',
  access: 'user',
  params: CreateGuestParams,
  body: CreateGuestRequest,
  response: CreateGuestResponse,
  async handle({ params, body, user }) {
    return {
      status: 201,
      body: await createGuest(weddyDeps(), params.weddingId, body, user.id),
    };
  },
});
