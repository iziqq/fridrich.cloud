import { GuestInputSchema, GuestSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `PUT /api/weddy/weddings/{weddingId}/guests/{guestId}` – úprava hosta; z rodiny ho nevyřadí. */

export const UpdateGuestRequest = GuestInputSchema;
export type UpdateGuestRequest = v.InferInput<typeof UpdateGuestRequest>;

export const UpdateGuestResponse = GuestSchema;
export type UpdateGuestResponse = v.InferOutput<typeof UpdateGuestResponse>;

export function updateGuest(
  weddingId: string,
  guestId: string,
  request: UpdateGuestRequest,
): Promise<UpdateGuestResponse> {
  return callEndpoint({
    method: 'PUT',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/guests/${encodeURIComponent(guestId)}`,
    body: { schema: UpdateGuestRequest, value: request },
    response: UpdateGuestResponse,
  });
}
