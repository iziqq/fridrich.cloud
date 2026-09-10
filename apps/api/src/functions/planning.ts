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
import { authenticatedEndpoint } from '../http/handler.js';
import { json, noContent, readJson } from '../http/responses.js';

/** Položky plánování a rozpočet – `/api/weddy/weddings/{weddingId}/items`. */

app.http('listItems', {
  methods: ['GET', 'OPTIONS'],
  route: 'weddy/weddings/{weddingId}/items',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) => {
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
  }),
});

app.http('createItem', {
  methods: ['POST', 'OPTIONS'],
  route: 'weddy/weddings/{weddingId}/items',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) => {
    const item = await createItem(
      weddyDeps(),
      request.params['weddingId'],
      await readJson(request),
      user.id,
    );
    return json(request, 201, item);
  }),
});

app.http('updateItem', {
  methods: ['PUT', 'OPTIONS'],
  route: 'weddy/weddings/{weddingId}/items/{itemId}',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) => {
    const item = await updateItem(
      weddyDeps(),
      request.params['weddingId'],
      request.params['itemId'],
      await readJson(request),
      user.id,
    );
    return json(request, 200, item);
  }),
});

app.http('updateItemStatus', {
  methods: ['PATCH', 'OPTIONS'],
  route: 'weddy/weddings/{weddingId}/items/{itemId}/status',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) => {
    const item = await changeItemStatus(
      weddyDeps(),
      request.params['weddingId'],
      request.params['itemId'],
      await readJson(request),
      user.id,
    );
    return json(request, 200, item);
  }),
});

app.http('deleteItem', {
  methods: ['DELETE', 'OPTIONS'],
  route: 'weddy/weddings/{weddingId}/items/{itemId}',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) => {
    await deleteItem(weddyDeps(), request.params['weddingId'], request.params['itemId'], user.id);
    return noContent(request);
  }),
});

app.http('getBudget', {
  methods: ['GET', 'OPTIONS'],
  route: 'weddy/weddings/{weddingId}/budget',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) =>
    json(request, 200, await getBudget(weddyDeps(), request.params['weddingId'], user.id)),
  ),
});
