import { WeddingDetailSchema, WeddingSettingsInputSchema } from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { updateWeddingSettings } from '../../../application/weddy/wedding.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/** `PUT /api/weddy/weddings/{weddingId}/settings` – název a datum svatby. Jen admin. */

export const UpdateWeddingSettingsParams = v.object({ weddingId: v.string() });
export type UpdateWeddingSettingsParams = v.InferOutput<typeof UpdateWeddingSettingsParams>;

export const UpdateWeddingSettingsRequest = WeddingSettingsInputSchema;
export type UpdateWeddingSettingsRequest = v.InferOutput<typeof UpdateWeddingSettingsRequest>;

export const UpdateWeddingSettingsResponse = WeddingDetailSchema;
export type UpdateWeddingSettingsResponse = v.InferOutput<typeof UpdateWeddingSettingsResponse>;

export const updateWeddingSettingsEndpoint = defineEndpoint({
  name: 'updateWeddingSettings',
  method: 'PUT',
  route: 'weddy/weddings/{weddingId}/settings',
  access: 'user',
  params: UpdateWeddingSettingsParams,
  body: UpdateWeddingSettingsRequest,
  response: UpdateWeddingSettingsResponse,
  async handle({ params, body, user }) {
    return {
      status: 200,
      body: await updateWeddingSettings(weddyDeps(), params.weddingId, body, user.id),
    };
  },
});
