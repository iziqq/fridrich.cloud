import {
  AgeGroupSchema,
  GuestSchema,
  GuestSideSchema,
  GuestStatsSchema,
  GuestStatusSchema,
} from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { callEndpoint } from '@/api/http';

/**
 * `GET /api/weddy/weddings/{weddingId}/guests` – seznam hostů a statistiky.
 *
 * Rodiny vlastní čtecí endpoint nemají – skládají se ze seznamu přes
 * `groupIntoFamilies()`.
 */

export const ListGuestsQuery = v.object({
  side: v.optional(GuestSideSchema),
  ageGroup: v.optional(AgeGroupSchema),
  status: v.optional(GuestStatusSchema),
});
export type ListGuestsQuery = v.InferInput<typeof ListGuestsQuery>;

export const ListGuestsResponse = v.object({
  guests: v.array(GuestSchema),
  stats: GuestStatsSchema,
});
export type ListGuestsResponse = v.InferOutput<typeof ListGuestsResponse>;

export function listGuests(weddingId: string, query: ListGuestsQuery = {}): Promise<ListGuestsResponse> {
  return callEndpoint({
    method: 'GET',
    path: `/weddy/weddings/${encodeURIComponent(weddingId)}/guests`,
    query,
    response: ListGuestsResponse,
  });
}
