import { InviteToWeddingInputSchema, WeddingAccessSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/**
 * `POST /api/weddy/weddings/{weddingId}/access` – pozvání do plánování. Jen admin.
 *
 * Kdo má účet, dostane přístup hned; kdo ne, dostane pozvánku a přístup mu
 * naskočí po registraci. Odpověď je vždy celý seznam přístupů.
 */

export const InviteToWeddingRequest = InviteToWeddingInputSchema;
export type InviteToWeddingRequest = v.InferInput<typeof InviteToWeddingRequest>;

export const InviteToWeddingResponse = WeddingAccessSchema;
export type InviteToWeddingResponse = v.InferOutput<typeof InviteToWeddingResponse>;

export function inviteToWedding(
  weddingId: string,
  request: InviteToWeddingRequest,
): Promise<InviteToWeddingResponse> {
  return callEndpoint({
    method: 'POST',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/access`,
    body: { schema: InviteToWeddingRequest, value: request },
    response: InviteToWeddingResponse,
  });
}
