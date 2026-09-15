import { BudgetSummarySchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { getBudget } from '../../../application/weddy/budget.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `GET /api/weddy/weddings/{weddingId}/budget` – rozpočet spočítaný z aktuálních položek. */

export const GetBudgetParams = v.object({ weddingId: v.string() });
export type GetBudgetParams = v.InferOutput<typeof GetBudgetParams>;

export const GetBudgetResponse = BudgetSummarySchema;
export type GetBudgetResponse = v.InferOutput<typeof GetBudgetResponse>;

export const getBudgetEndpoint = defineEndpoint({
  name: 'getBudget',
  method: 'GET',
  route: 'weddy/weddings/{weddingId}/budget',
  access: 'user',
  params: GetBudgetParams,
  response: GetBudgetResponse,
  async handle({ params, user }) {
    return { status: 200, body: await getBudget(weddyDeps(), params.weddingId, user.id) };
  },
});
