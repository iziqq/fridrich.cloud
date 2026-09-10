import { app } from '@azure/functions';
import { isPlanningCategory } from '@fridrich/weddy-shared';
import {
  changeItemStatus,
  createItem,
  deleteItem,
  getBudget,
  listItems,
  updateItem,
} from '../application/weddy/planning.js';
import { weddyDeps } from '../infrastructure/container.js';
import { routeByMethod } from '../http/handler.js';
import { json, noContent, readJson } from '../http/responses.js';

/** Položky plánování a rozpočet – `/api/weddy/weddings/{weddingId}/items`. */

app.http('itemCollection', {
  route: 'weddy/weddings/{weddingId}/items',
  authLevel: 'anonymous',
  ...routeByMethod({
    GET: async (request, _context, user) => {
      const category = new URL(request.url).searchParams.get('category');

      return json(
        request,
        200,
        await listItems(
          weddyDeps(),
          request.params['weddingId'],
          user.id,
          isPlanningCategory(category) ? category : undefined,
        ),
      );
    },

    POST: async (request, _context, user) =>
      json(
        request,
        201,
        await createItem(
          weddyDeps(),
          request.params['weddingId'],
          await readJson(request),
          user.id,
        ),
      ),
  }),
});

app.http('itemItem', {
  route: 'weddy/weddings/{weddingId}/items/{itemId}',
  authLevel: 'anonymous',
  ...routeByMethod({
    PUT: async (request, _context, user) =>
      json(
        request,
        200,
        await updateItem(
          weddyDeps(),
          request.params['weddingId'],
          request.params['itemId'],
          await readJson(request),
          user.id,
        ),
      ),

    DELETE: async (request, _context, user) => {
      await deleteItem(weddyDeps(), request.params['weddingId'], request.params['itemId'], user.id);
      return noContent(request);
    },
  }),
});

app.http('itemStatus', {
  route: 'weddy/weddings/{weddingId}/items/{itemId}/status',
  authLevel: 'anonymous',
  ...routeByMethod({
    PATCH: async (request, _context, user) =>
      json(
        request,
        200,
        await changeItemStatus(
          weddyDeps(),
          request.params['weddingId'],
          request.params['itemId'],
          await readJson(request),
          user.id,
        ),
      ),
  }),
});

app.http('budget', {
  route: 'weddy/weddings/{weddingId}/budget',
  authLevel: 'anonymous',
  ...routeByMethod({
    GET: async (request, _context, user) =>
      json(request, 200, await getBudget(weddyDeps(), request.params['weddingId'], user.id)),
  }),
});
