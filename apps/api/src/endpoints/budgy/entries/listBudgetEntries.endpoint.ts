import { BudgetEntrySchema } from '@fridrich/budgy-shared';
import * as v from 'valibot';
import { listEntries } from '../../../application/budgy/entries.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { budgyDeps } from '../../../infrastructure/container.js';

/**
 * `GET /api/budgy/entries` – všechny položky rozpočtu přihlášeného uživatele.
 *
 * Vrací se celý seznam, ne jeden měsíc: pravidelné položky platí napříč
 * měsíci a listování dozadu i graf vývoje by jinak znamenaly dotaz za dotazem.
 */

export const ListBudgetEntriesResponse = v.array(BudgetEntrySchema);
export type ListBudgetEntriesResponse = v.InferOutput<typeof ListBudgetEntriesResponse>;

export const listBudgetEntriesEndpoint = defineEndpoint({
  name: 'listBudgetEntries',
  method: 'GET',
  route: 'budgy/entries',
  access: 'user',
  response: ListBudgetEntriesResponse,
  async handle({ user }) {
    return { status: 200, body: await listEntries(budgyDeps(), user.id) };
  },
});
