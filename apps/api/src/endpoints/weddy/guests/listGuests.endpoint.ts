import {
  AgeGroupSchema,
  GuestSchema,
  GuestSideSchema,
  GuestStatsSchema,
  GuestStatusSchema,
} from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { listGuests } from '../../../application/weddy/guests.js';
import { defineEndpoint } from '../../../http/endpoint.js';
import { weddyDeps } from '../../../infrastructure/container.js';

/**
 * `GET /api/weddy/weddings/{weddingId}/guests` – seznam hostů a statistiky.
 *
 * Rodiny vlastní čtecí endpoint nemají – frontend si je poskládá ze seznamu
 * přes `groupIntoFamilies()`. Statistiky se počítají ze všech hostů, filtr
 * ovlivňuje jen seznam.
 */

export const ListGuestsParams = v.object({ weddingId: v.string() });
export type ListGuestsParams = v.InferOutput<typeof ListGuestsParams>;

export const ListGuestsQuery = v.object({
  side: v.optional(GuestSideSchema),
  ageGroup: v.optional(AgeGroupSchema),
  status: v.optional(GuestStatusSchema),
});
export type ListGuestsQuery = v.InferOutput<typeof ListGuestsQuery>;

export const ListGuestsResponse = v.object({
  guests: v.array(GuestSchema),
  stats: GuestStatsSchema,
});
export type ListGuestsResponse = v.InferOutput<typeof ListGuestsResponse>;

export const listGuestsEndpoint = defineEndpoint({
  name: 'listGuests',
  method: 'GET',
  route: 'weddy/weddings/{weddingId}/guests',
  access: 'user',
  params: ListGuestsParams,
  query: ListGuestsQuery,
  response: ListGuestsResponse,
  async handle({ params, query, user }) {
    return {
      status: 200,
      body: await listGuests(weddyDeps(), params.weddingId, user.id, query),
    };
  },
});
