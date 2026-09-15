import { FamilyInputSchema, FamilySchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `POST /api/weddy/weddings/{weddingId}/families` – založení rodiny i se všemi členy. */

export const CreateFamilyRequest = FamilyInputSchema;
export type CreateFamilyRequest = v.InferInput<typeof CreateFamilyRequest>;

export const CreateFamilyResponse = FamilySchema;
export type CreateFamilyResponse = v.InferOutput<typeof CreateFamilyResponse>;

export function createFamily(
  weddingId: string,
  request: CreateFamilyRequest,
): Promise<CreateFamilyResponse> {
  return callEndpoint({
    method: 'POST',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/families`,
    body: { schema: CreateFamilyRequest, value: request },
    response: CreateFamilyResponse,
  });
}
