import * as v from 'valibot';
import { applyAccountRetention } from '../../application/identity/account.js';
import { getConfig } from '../../config.js';
import { defineEndpoint } from '../../http/endpoint.js';
import { identityDeps } from '../../infrastructure/container.js';

/**
 * `POST /api/maintenance/account-retention` – upozorní a smaže neaktivní účty.
 * Volá ho jen denní plánovač (`.github/workflows/data-retention.yml`) s tokenem v hlavičce.
 */

export const ApplyAccountRetentionResponse = v.object({
  warned: v.number(),
  deleted: v.number(),
});
export type ApplyAccountRetentionResponse = v.InferOutput<typeof ApplyAccountRetentionResponse>;

export const applyAccountRetentionEndpoint = defineEndpoint({
  name: 'applyAccountRetention',
  method: 'POST',
  route: 'maintenance/account-retention',
  access: 'maintenance',
  response: ApplyAccountRetentionResponse,
  async handle() {
    const result = await applyAccountRetention(identityDeps(), getConfig().appUrl);
    return { status: 200, body: result };
  },
});
