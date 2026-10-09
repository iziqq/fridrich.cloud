import { MapTapBoardSchema } from '@fridrich/maptap-shared';
import * as v from 'valibot';
import { getBoard } from '../../../application/maptap/scores.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { maptapDeps } from '../../../infrastructure/container.js';

/**
 * `GET /api/maptap/board` – hráči a všechny jejich výsledky.
 *
 * Jedním dotazem celá tabule: pořadí dne i celkové pořadí se počítají na
 * obrazovce ze stejných dat, takže přepnutí dne nebo záložky nestojí další
 * volání. Hraje pár lidí jednou denně – kdyby seznam někdy narostl, stránkuje
 * se tady.
 */

export const GetMapTapBoardResponse = MapTapBoardSchema;
export type GetMapTapBoardResponse = v.InferOutput<typeof GetMapTapBoardResponse>;

export const getMapTapBoardEndpoint = defineEndpoint({
  name: 'getMapTapBoard',
  method: 'GET',
  route: 'maptap/board',
  access: 'user',
  response: GetMapTapBoardResponse,
  async handle() {
    return { status: 200, body: await getBoard(maptapDeps()) };
  },
});
