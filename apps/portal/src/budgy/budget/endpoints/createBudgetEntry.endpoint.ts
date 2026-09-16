import { BudgetEntryInputSchema, BudgetEntrySchema } from '@fridrich/budgy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/budgy/entries` – nová položka rozpočtu. */

export const CreateBudgetEntryRequest = BudgetEntryInputSchema;
export type CreateBudgetEntryRequest = v.InferInput<typeof CreateBudgetEntryRequest>;

export const CreateBudgetEntryResponse = BudgetEntrySchema;
export type CreateBudgetEntryResponse = v.InferOutput<typeof CreateBudgetEntryResponse>;

export function createBudgetEntry(
  request: CreateBudgetEntryRequest,
): Promise<CreateBudgetEntryResponse> {
  return callEndpoint({
    method: 'POST',
    path: '/budgy/entries',
    body: { schema: CreateBudgetEntryRequest, value: request },
    response: CreateBudgetEntryResponse,
  });
}
