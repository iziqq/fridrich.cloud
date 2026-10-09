import { MapTapScoreSchema, ScoreInputSchema } from '@fridrich/maptap-shared';
import * as v from 'valibot';
import { addScore } from '../../../application/maptap/scores.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { maptapDeps } from '../../../infrastructure/container.js';

/**
 * `POST /api/maptap/scores` – vložení výsledku zkopírovaného z MapTapu.
 *
 * Tělo je pořád ten text, ne hotová čísla: rozebrání patří schématu, takže
 * API nevěří tomu, co napočítal prohlížeč, a nikdo si nemůže poslat
 * vymyšlený výsledek jinak než tak, že si ho vymyslí rovnou v textu.
 */

export const CreateMapTapScoreRequest = ScoreInputSchema;
export type CreateMapTapScoreRequest = v.InferOutput<typeof CreateMapTapScoreRequest>;

export const CreateMapTapScoreResponse = MapTapScoreSchema;
export type CreateMapTapScoreResponse = v.InferOutput<typeof CreateMapTapScoreResponse>;

export const createMapTapScoreEndpoint = defineEndpoint({
  name: 'createMapTapScore',
  method: 'POST',
  route: 'maptap/scores',
  access: 'user',
  body: CreateMapTapScoreRequest,
  response: CreateMapTapScoreResponse,
  async handle({ body, user }) {
    return { status: 201, body: await addScore(maptapDeps(), body, user.id) };
  },
});
