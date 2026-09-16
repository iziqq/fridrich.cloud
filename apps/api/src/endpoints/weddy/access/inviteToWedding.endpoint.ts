import { InviteToWeddingInputSchema, WeddingAccessSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { inviteToWedding } from '../../../application/weddy/access.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { requestLocale } from '../../../http/responses.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/**
 * `POST /api/weddy/weddings/{weddingId}/access` – pozvání do plánování. Jen admin.
 *
 * Kdo má účet, dostane přístup hned; kdo ne, dostane pozvánku a přístup mu
 * naskočí po registraci. Odpověď je vždy celý seznam přístupů.
 */

export const InviteToWeddingParams = v.object({ weddingId: v.string() });
export type InviteToWeddingParams = v.InferOutput<typeof InviteToWeddingParams>;

export const InviteToWeddingRequest = InviteToWeddingInputSchema;
export type InviteToWeddingRequest = v.InferOutput<typeof InviteToWeddingRequest>;

export const InviteToWeddingResponse = WeddingAccessSchema;
export type InviteToWeddingResponse = v.InferOutput<typeof InviteToWeddingResponse>;

export const inviteToWeddingEndpoint = defineEndpoint({
  name: 'inviteToWedding',
  method: 'POST',
  route: 'weddy/weddings/{weddingId}/access',
  access: 'user',
  params: InviteToWeddingParams,
  body: InviteToWeddingRequest,
  response: InviteToWeddingResponse,
  async handle({ params, body, user, request }) {
    return {
      status: 201,
      body: await inviteToWedding(
        weddyDeps(),
        params.weddingId,
        { ...body, locale: requestLocale(request) },
        user.id,
      ),
    };
  },
});
