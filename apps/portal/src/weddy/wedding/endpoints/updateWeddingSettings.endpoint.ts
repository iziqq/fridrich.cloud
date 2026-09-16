import { WeddingDetailSchema, WeddingSettingsInputSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `PUT /api/weddy/weddings/{weddingId}/settings` – název a datum svatby. Jen admin. */

export const UpdateWeddingSettingsRequest = WeddingSettingsInputSchema;
export type UpdateWeddingSettingsRequest = v.InferInput<typeof UpdateWeddingSettingsRequest>;

export const UpdateWeddingSettingsResponse = WeddingDetailSchema;
export type UpdateWeddingSettingsResponse = v.InferOutput<typeof UpdateWeddingSettingsResponse>;

export function updateWeddingSettings(
  weddingId: string,
  request: UpdateWeddingSettingsRequest,
): Promise<UpdateWeddingSettingsResponse> {
  return callEndpoint({
    method: 'PUT',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/settings`,
    body: { schema: UpdateWeddingSettingsRequest, value: request },
    response: UpdateWeddingSettingsResponse,
  });
}
