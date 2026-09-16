import { BudgetEntryInputSchema, BudgetEntrySchema } from '@fridrich/budgy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `PUT /api/budgy/entries/{entryId}` – úprava položky rozpočtu. */

export const UpdateBudgetEntryRequest = BudgetEntryInputSchema;
export type UpdateBudgetEntryRequest = v.InferInput<typeof UpdateBudgetEntryRequest>;

export const UpdateBudgetEntryResponse = BudgetEntrySchema;
export type UpdateBudgetEntryResponse = v.InferOutput<typeof UpdateBudgetEntryResponse>;

export function updateBudgetEntry(
  entryId: string,
  request: UpdateBudgetEntryRequest,
): Promise<UpdateBudgetEntryResponse> {
  return callEndpoint({
    method: 'PUT',
    path: `/budgy/entries/${encodeURIComponent(entryId)}`,
    body: { schema: UpdateBudgetEntryRequest, value: request },
    response: UpdateBudgetEntryResponse,
  });
}
