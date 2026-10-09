import { MapTapBoardSchema } from '@fridrich/maptap-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/** `GET /api/maptap/board` – hráči a všechny jejich výsledky. */

export const GetMapTapBoardResponse = MapTapBoardSchema;
export type GetMapTapBoardResponse = v.InferOutput<typeof GetMapTapBoardResponse>;

export function getMapTapBoard(): Promise<GetMapTapBoardResponse> {
  return callEndpoint({
    method: 'GET',
    path: '/maptap/board',
    response: GetMapTapBoardResponse,
  });
}
