import { app, type HttpRequest } from '@azure/functions';
import { isAgeGroup, isGuestSide, isGuestStatus } from '@fridrich/weddy-shared';
import {
  changeGuestStatus,
  createGuest,
  deleteGuest,
  listGuests,
  updateGuest,
} from '../application/weddy/guests.js';
import type { GuestFilter } from '../domain/weddy/ports.js';
import { weddyDeps } from '../infrastructure/container.js';
import { routeByMethod } from '../http/handler.js';
import { json, noContent, readJson } from '../http/responses.js';

/** Hosté – `/api/weddy/weddings/{weddingId}/guests`. */

function parseFilter(request: HttpRequest): GuestFilter {
  const params = new URL(request.url).searchParams;
  const filter: GuestFilter = {};

  const side = params.get('side');
  if (isGuestSide(side)) filter.side = side;

  const ageGroup = params.get('ageGroup');
  if (isAgeGroup(ageGroup)) filter.ageGroup = ageGroup;

  const status = params.get('status');
  if (isGuestStatus(status)) filter.status = status;

  return filter;
}

app.http('guestCollection', {
  route: 'weddy/weddings/{weddingId}/guests',
  authLevel: 'anonymous',
  ...routeByMethod({
    GET: async (request, _context, user) =>
      json(
        request,
        200,
        await listGuests(weddyDeps(), request.params['weddingId'], user.id, parseFilter(request)),
      ),

    POST: async (request, _context, user) =>
      json(
        request,
        201,
        await createGuest(
          weddyDeps(),
          request.params['weddingId'],
          await readJson(request),
          user.id,
        ),
      ),
  }),
});

app.http('guestItem', {
  route: 'weddy/weddings/{weddingId}/guests/{guestId}',
  authLevel: 'anonymous',
  ...routeByMethod({
    PUT: async (request, _context, user) =>
      json(
        request,
        200,
        await updateGuest(
          weddyDeps(),
          request.params['weddingId'],
          request.params['guestId'],
          await readJson(request),
          user.id,
        ),
      ),

    DELETE: async (request, _context, user) => {
      await deleteGuest(
        weddyDeps(),
        request.params['weddingId'],
        request.params['guestId'],
        user.id,
      );
      return noContent(request);
    },
  }),
});

app.http('guestStatus', {
  route: 'weddy/weddings/{weddingId}/guests/{guestId}/status',
  authLevel: 'anonymous',
  ...routeByMethod({
    PATCH: async (request, _context, user) =>
      json(
        request,
        200,
        await changeGuestStatus(
          weddyDeps(),
          request.params['weddingId'],
          request.params['guestId'],
          await readJson(request),
          user.id,
        ),
      ),
  }),
});
