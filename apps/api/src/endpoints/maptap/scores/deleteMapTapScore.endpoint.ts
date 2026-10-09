import * as v from 'valibot';
import { removeScore } from '../../../application/maptap/scores.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { maptapDeps } from '../../../infrastructure/container.js';

/** `DELETE /api/maptap/scores/{scoreId}` – smazání vlastního výsledku. */

export const DeleteMapTapScoreParams = v.object({ scoreId: v.string() });
export type DeleteMapTapScoreParams = v.InferOutput<typeof DeleteMapTapScoreParams>;

export const deleteMapTapScoreEndpoint = defineEndpoint({
  name: 'deleteMapTapScore',
  method: 'DELETE',
  route: 'maptap/scores/{scoreId}',
  access: 'user',
  params: DeleteMapTapScoreParams,
  async handle({ params, user }) {
    await removeScore(maptapDeps(), params.scoreId, user.id);
    return { status: 204 };
  },
});
