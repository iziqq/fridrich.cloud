import { FamilyInputSchema, FamilySchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { createFamily } from '../../../application/weddy/guests.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `POST /api/weddy/weddings/{weddingId}/families` – založení rodiny i se všemi členy. */

export const CreateFamilyParams = v.object({ weddingId: v.string() });
export type CreateFamilyParams = v.InferOutput<typeof CreateFamilyParams>;

export const CreateFamilyRequest = FamilyInputSchema;
export type CreateFamilyRequest = v.InferOutput<typeof CreateFamilyRequest>;

export const CreateFamilyResponse = FamilySchema;
export type CreateFamilyResponse = v.InferOutput<typeof CreateFamilyResponse>;

export const createFamilyEndpoint = defineEndpoint({
  name: 'createFamily',
  method: 'POST',
  route: 'weddy/weddings/{weddingId}/families',
  access: 'user',
  params: CreateFamilyParams,
  body: CreateFamilyRequest,
  response: CreateFamilyResponse,
  async handle({ params, body, user }) {
    return {
      status: 201,
      body: await createFamily(weddyDeps(), params.weddingId, body, user.id),
    };
  },
});
