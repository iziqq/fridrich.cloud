import { BudgetEntryInputSchema, BudgetEntrySchema } from '@fridrich/budgy-shared';
import * as v from 'valibot';
import { createEntry } from '../../../application/budgy/entries.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { budgyDeps } from '../../../infrastructure/container.js';

/** `POST /api/budgy/entries` – nová položka rozpočtu. */

export const CreateBudgetEntryRequest = BudgetEntryInputSchema;
export type CreateBudgetEntryRequest = v.InferOutput<typeof CreateBudgetEntryRequest>;

export const CreateBudgetEntryResponse = BudgetEntrySchema;
export type CreateBudgetEntryResponse = v.InferOutput<typeof CreateBudgetEntryResponse>;

export const createBudgetEntryEndpoint = defineEndpoint({
  name: 'createBudgetEntry',
  method: 'POST',
  route: 'budgy/entries',
  access: 'user',
  body: CreateBudgetEntryRequest,
  response: CreateBudgetEntryResponse,
  async handle({ body, user }) {
    return { status: 201, body: await createEntry(budgyDeps(), body, user.id) };
  },
});
