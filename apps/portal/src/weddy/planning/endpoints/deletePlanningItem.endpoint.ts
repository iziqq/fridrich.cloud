import { callEndpoint } from '@/api/http';

/** `DELETE /api/weddy/weddings/{weddingId}/items/{itemId}` – smazání položky. */

export function deletePlanningItem(weddingId: string, itemId: string): Promise<void> {
  return callEndpoint({
    method: 'DELETE',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/items/${encodeURIComponent(itemId)}`,
  });
}
