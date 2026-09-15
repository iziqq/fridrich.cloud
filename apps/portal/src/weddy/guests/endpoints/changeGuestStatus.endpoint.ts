import { GuestSchema, GuestStatusSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `PATCH /api/weddy/weddings/{weddingId}/guests/{guestId}/status` – rychlá změna stavu ze seznamu. */

export const ChangeGuestStatusRequest = v.object({ status: GuestStatusSchema });
export type ChangeGuestStatusRequest = v.InferInput<typeof ChangeGuestStatusRequest>;

export const ChangeGuestStatusResponse = GuestSchema;
export type ChangeGuestStatusResponse = v.InferOutput<typeof ChangeGuestStatusResponse>;

export function changeGuestStatus(
  weddingId: string,
  guestId: string,
  request: ChangeGuestStatusRequest,
): Promise<ChangeGuestStatusResponse> {
  return callEndpoint({
    method: 'PATCH',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/guests/${encodeURIComponent(guestId)}/status`,
    body: { schema: ChangeGuestStatusRequest, value: request },
    response: ChangeGuestStatusResponse,
  });
}
