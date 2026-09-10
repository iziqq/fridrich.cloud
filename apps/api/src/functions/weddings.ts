import { app } from '@azure/functions';
import {
  createWedding,
  deleteWedding,
  getWedding,
  listWeddings,
  updateWedding,
} from '../application/weddy/weddings.js';
import { weddyDeps } from '../infrastructure/container.js';
import { authenticatedEndpoint } from '../http/handler.js';
import { json, noContent, readJson } from '../http/responses.js';

/** Plánování svateb – `/api/weddy/weddings`. */

app.http('listWeddings', {
  methods: ['GET', 'OPTIONS'],
  route: 'weddy/weddings',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) =>
    json(request, 200, await listWeddings(weddyDeps(), user.id)),
  ),
});

app.http('createWedding', {
  methods: ['POST', 'OPTIONS'],
  route: 'weddy/weddings',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) => {
    const wedding = await createWedding(weddyDeps(), await readJson(request), user.id);
    return json(request, 201, wedding);
  }),
});

app.http('getWedding', {
  methods: ['GET', 'OPTIONS'],
  route: 'weddy/weddings/{weddingId}',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) =>
    json(request, 200, await getWedding(weddyDeps(), request.params['weddingId'], user.id)),
  ),
});

app.http('updateWedding', {
  methods: ['PUT', 'OPTIONS'],
  route: 'weddy/weddings/{weddingId}',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) => {
    const wedding = await updateWedding(
      weddyDeps(),
      request.params['weddingId'],
      await readJson(request),
      user.id,
    );
    return json(request, 200, wedding);
  }),
});

app.http('deleteWedding', {
  methods: ['DELETE', 'OPTIONS'],
  route: 'weddy/weddings/{weddingId}',
  authLevel: 'anonymous',
  handler: authenticatedEndpoint(async (request, _context, user) => {
    await deleteWedding(weddyDeps(), request.params['weddingId'], user.id);
    return noContent(request);
  }),
});
