import { FamilyInputSchema, FamilySchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { updateFamily } from '../../../application/weddy/guests.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/**
 * `PUT /api/weddy/weddings/{weddingId}/families/{familyId}` – přepis rodiny.
 *
 * Seznam členů je úplný: člen s `id` se upraví, bez `id` vznikne, chybějící
 * se smaže.
 */

export const UpdateFamilyParams = v.object({ weddingId: v.string(), familyId: v.string() });
export type UpdateFamilyParams = v.InferOutput<typeof UpdateFamilyParams>;

export const UpdateFamilyRequest = FamilyInputSchema;
export type UpdateFamilyRequest = v.InferOutput<typeof UpdateFamilyRequest>;

export const UpdateFamilyResponse = FamilySchema;
export type UpdateFamilyResponse = v.InferOutput<typeof UpdateFamilyResponse>;

export const updateFamilyEndpoint = defineEndpoint({
  name: 'updateFamily',
  method: 'PUT',
  route: 'weddy/weddings/{weddingId}/families/{familyId}',
  access: 'user',
  params: UpdateFamilyParams,
  body: UpdateFamilyRequest,
  response: UpdateFamilyResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await updateFamily(weddyDeps(), params.weddingId, params.familyId, body, user.id),
    };
  },
});
