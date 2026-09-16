import { BudgetEntrySchema } from '@fridrich/budgy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `GET /api/budgy/entries` – všechny položky rozpočtu přihlášeného uživatele. */

export const ListBudgetEntriesResponse = v.array(BudgetEntrySchema);
export type ListBudgetEntriesResponse = v.InferOutput<typeof ListBudgetEntriesResponse>;

export function listBudgetEntries(): Promise<ListBudgetEntriesResponse> {
  return callEndpoint({
    method: 'GET',
    path: '/budgy/entries',
    response: ListBudgetEntriesResponse,
  });
}
