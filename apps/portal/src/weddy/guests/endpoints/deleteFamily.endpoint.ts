import { callEndpoint } from '@/api/http';

/** `DELETE /api/weddy/weddings/{weddingId}/families/{familyId}` – smazání rodiny i všech členů. */

export function deleteFamily(weddingId: string, familyId: string): Promise<void> {
  return callEndpoint({
    method: 'DELETE',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/families/${encodeURIComponent(familyId)}`,
  });
}
