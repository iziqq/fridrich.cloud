import { GuestInputSchema, GuestSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/weddy/weddings/{weddingId}/guests` – přidání hosta. */

export const CreateGuestRequest = GuestInputSchema;
export type CreateGuestRequest = v.InferInput<typeof CreateGuestRequest>;

export const CreateGuestResponse = GuestSchema;
export type CreateGuestResponse = v.InferOutput<typeof CreateGuestResponse>;

export function createGuest(
  weddingId: string,
  request: CreateGuestRequest,
): Promise<CreateGuestResponse> {
  return callEndpoint({
    method: 'POST',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/guests`,
    body: { schema: CreateGuestRequest, value: request },
    response: CreateGuestResponse,
  });
}
