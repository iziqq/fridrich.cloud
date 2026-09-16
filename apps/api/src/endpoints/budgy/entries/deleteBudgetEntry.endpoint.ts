import * as v from 'valibot';
import { deleteEntry } from '../../../application/budgy/entries.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { budgyDeps } from '../../../infrastructure/container.js';

/** `DELETE /api/budgy/entries/{entryId}` – smazání položky. Odpověď 204. */

export const DeleteBudgetEntryParams = v.object({ entryId: v.string() });
export type DeleteBudgetEntryParams = v.InferOutput<typeof DeleteBudgetEntryParams>;

export const deleteBudgetEntryEndpoint = defineEndpoint({
  name: 'deleteBudgetEntry',
  method: 'DELETE',
  route: 'budgy/entries/{entryId}',
  access: 'user',
  params: DeleteBudgetEntryParams,
  async handle({ params, user }) {
    await deleteEntry(budgyDeps(), params.entryId, user.id);
    return { status: 204 };
  },
});
