import { BudgetEntryInputSchema, BudgetEntrySchema } from '@fridrich/budgy-shared';
import * as v from 'valibot';
import { updateEntry } from '../../../application/budgy/entries.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { budgyDeps } from '../../../infrastructure/container.js';

/** `PUT /api/budgy/entries/{entryId}` – úprava položky rozpočtu. */

export const UpdateBudgetEntryParams = v.object({ entryId: v.string() });
export type UpdateBudgetEntryParams = v.InferOutput<typeof UpdateBudgetEntryParams>;

export const UpdateBudgetEntryRequest = BudgetEntryInputSchema;
export type UpdateBudgetEntryRequest = v.InferOutput<typeof UpdateBudgetEntryRequest>;

export const UpdateBudgetEntryResponse = BudgetEntrySchema;
export type UpdateBudgetEntryResponse = v.InferOutput<typeof UpdateBudgetEntryResponse>;

export const updateBudgetEntryEndpoint = defineEndpoint({
  name: 'updateBudgetEntry',
  method: 'PUT',
  route: 'budgy/entries/{entryId}',
  access: 'user',
  params: UpdateBudgetEntryParams,
  body: UpdateBudgetEntryRequest,
  response: UpdateBudgetEntryResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await updateEntry(budgyDeps(), params.entryId, body, user.id),
    };
  },
});
