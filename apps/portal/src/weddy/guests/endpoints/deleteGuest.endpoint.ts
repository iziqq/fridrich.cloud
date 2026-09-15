import { callEndpoint } from '@/api/http';

/** `DELETE /api/weddy/weddings/{weddingId}/guests/{guestId}` – smazání hosta. */

export function deleteGuest(weddingId: string, guestId: string): Promise<void> {
  return callEndpoint({
    method: 'DELETE',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/guests/${encodeURIComponent(guestId)}`,
  });
}
