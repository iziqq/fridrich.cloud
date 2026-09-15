import { BudgetSummarySchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `GET /api/weddy/weddings/{weddingId}/budget` – rozpočet spočítaný z aktuálních položek. */

export const GetBudgetResponse = BudgetSummarySchema;
export type GetBudgetResponse = v.InferOutput<typeof GetBudgetResponse>;

export function getBudget(weddingId: string): Promise<GetBudgetResponse> {
  return callEndpoint({
    method: 'GET',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/budget`,
    response: GetBudgetResponse,
  });
}
