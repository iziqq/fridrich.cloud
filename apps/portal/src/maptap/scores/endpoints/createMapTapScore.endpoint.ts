import { MapTapScoreSchema, ScoreTextInputSchema } from '@fridrich/maptap-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/**
 * `POST /api/maptap/scores` – vložení výsledku zkopírovaného z MapTapu.
 *
 * Posílá se text, ne rozebraná čísla: rozebrat si ho musí API samo, jinak by
 * stačilo poslat vymyšlený výsledek mimo formulář.
 */

/* Posílá se text; rozebere si ho API (`ScoreInputSchema`), ne `callEndpoint`. */
export const CreateMapTapScoreRequest = ScoreTextInputSchema;
export type CreateMapTapScoreRequest = v.InferInput<typeof CreateMapTapScoreRequest>;

export const CreateMapTapScoreResponse = MapTapScoreSchema;
export type CreateMapTapScoreResponse = v.InferOutput<typeof CreateMapTapScoreResponse>;

export function createMapTapScore(
  request: CreateMapTapScoreRequest,
): Promise<CreateMapTapScoreResponse> {
  return callEndpoint({
    method: 'POST',
    path: '/maptap/scores',
    body: { schema: CreateMapTapScoreRequest, value: request },
    response: CreateMapTapScoreResponse,
  });
}
