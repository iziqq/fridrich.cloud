import { callEndpoint } from '@/api/http';

/** `DELETE /api/budgy/entries/{entryId}` – smazání položky. */

export function deleteBudgetEntry(entryId: string): Promise<void> {
  return callEndpoint({
    method: 'DELETE',
    path: `/budgy/entries/${encodeURIComponent(entryId)}`,
  });
}
