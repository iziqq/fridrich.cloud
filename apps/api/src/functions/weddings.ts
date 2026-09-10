import { app } from '@azure/functions';
import {
  createWedding,
  deleteWedding,
  getWedding,
  listWeddings,
  updateWedding,
} from '../application/weddy/weddings.js';
import { weddyDeps } from '../infrastructure/container.js';
import { routeByMethod } from '../http/handler.js';
import { json, noContent, readJson } from '../http/responses.js';

/** Plánování svateb – `/api/weddy/weddings`. */

app.http('weddingCollection', {
  route: 'weddy/weddings',
  authLevel: 'anonymous',
  ...routeByMethod({
    GET: async (request, _context, user) =>
      json(request, 200, await listWeddings(weddyDeps(), user.id)),

    POST: async (request, _context, user) =>
      json(request, 201, await createWedding(weddyDeps(), await readJson(request), user.id)),
  }),
});

app.http('weddingItem', {
  route: 'weddy/weddings/{weddingId}',
  authLevel: 'anonymous',
  ...routeByMethod({
    GET: async (request, _context, user) =>
      json(request, 200, await getWedding(weddyDeps(), request.params['weddingId'], user.id)),

    PUT: async (request, _context, user) =>
      json(
        request,
        200,
        await updateWedding(
          weddyDeps(),
          request.params['weddingId'],
          await readJson(request),
          user.id,
        ),
      ),

    DELETE: async (request, _context, user) => {
      await deleteWedding(weddyDeps(), request.params['weddingId'], user.id);
      return noContent(request);
    },
  }),
});
