import { callEndpoint } from '@/api/http';

/** `DELETE /api/weddy/weddings/{weddingId}` – smazání plánování včetně hostů a položek. */

export function deleteWedding(weddingId: string): Promise<void> {
  return callEndpoint({
    method: 'DELETE',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}`,
  });
}
