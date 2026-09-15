import { FamilyInputSchema, FamilySchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/**
 * `PUT /api/weddy/weddings/{weddingId}/families/{familyId}` – přepis rodiny.
 *
 * Seznam členů je úplný: člen s `id` se upraví, bez `id` vznikne, chybějící se smaže.
 */

export const UpdateFamilyRequest = FamilyInputSchema;
export type UpdateFamilyRequest = v.InferInput<typeof UpdateFamilyRequest>;

export const UpdateFamilyResponse = FamilySchema;
export type UpdateFamilyResponse = v.InferOutput<typeof UpdateFamilyResponse>;

export function updateFamily(
  weddingId: string,
  familyId: string,
  request: UpdateFamilyRequest,
): Promise<UpdateFamilyResponse> {
  return callEndpoint({
    method: 'PUT',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/families/${encodeURIComponent(familyId)}`,
    body: { schema: UpdateFamilyRequest, value: request },
    response: UpdateFamilyResponse,
  });
}
