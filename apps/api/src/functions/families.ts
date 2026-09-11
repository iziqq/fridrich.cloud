import { app } from '@azure/functions';
import { createFamily, deleteFamily, updateFamily } from '../application/weddy/families.js';
import { weddyDeps } from '../infrastructure/container.js';
import { routeByMethod } from '../http/handler.js';
import { json, noContent, readJson } from '../http/responses.js';

/**
 * Rodiny – `/api/weddy/weddings/{weddingId}/families`.
 *
 * Rodina není samostatný záznam, jen skupina hostů. Čtení proto vlastní
 * endpoint nemá – rodiny se poskládají ze seznamu hostů, který už klient má.
 */

app.http('familyCollection', {
  route: 'weddy/weddings/{weddingId}/families',
  authLevel: 'anonymous',
  ...routeByMethod({
    POST: async (request, _context, user) =>
      json(
        request,
        201,
        await createFamily(
          weddyDeps(),
          request.params['weddingId'],
          await readJson(request),
          user.id,
        ),
      ),
  }),
});

app.http('familyItem', {
  route: 'weddy/weddings/{weddingId}/families/{familyId}',
  authLevel: 'anonymous',
  ...routeByMethod({
    PUT: async (request, _context, user) =>
      json(
        request,
        200,
        await updateFamily(
          weddyDeps(),
          request.params['weddingId'],
          request.params['familyId'],
          await readJson(request),
          user.id,
        ),
      ),

    DELETE: async (request, _context, user) => {
      await deleteFamily(
        weddyDeps(),
        request.params['weddingId'],
        request.params['familyId'],
        user.id,
      );
      return noContent(request);
    },
  }),
});
