import { callEndpoint } from '@/api/http';

/** `DELETE /api/maptap/scores/{scoreId}` – smazání vlastního výsledku. */

export function deleteMapTapScore(scoreId: string): Promise<void> {
  return callEndpoint({
    method: 'DELETE',
    path: `/maptap/scores/${encodeURIComponent(scoreId)}`,
  });
}
