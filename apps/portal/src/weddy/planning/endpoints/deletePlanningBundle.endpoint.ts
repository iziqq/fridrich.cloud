import { callEndpoint } from '@/api/http';

/**
 * `DELETE /api/weddy/weddings/{weddingId}/bundles/{bundleId}` – smazání balíčku.
 * Položky zůstávají, jen z něj vypadnou.
 */

export function deletePlanningBundle(weddingId: string, bundleId: string): Promise<void> {
  return callEndpoint({
    method: 'DELETE',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/bundles/${encodeURIComponent(bundleId)}`,
  });
}
