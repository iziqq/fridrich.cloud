import { app } from '@azure/functions';
import { submitContactMessage } from '../application/contact/submitContactMessage.js';
import { contactDeps } from '../infrastructure/container.js';
import { publicEndpoint } from '../http/handler.js';
import { clientIp, json, readJson } from '../http/responses.js';

/**
 * Kontaktni formular z portalu - jediny verejny zapisovy endpoint.
 * Ochrana proti zneuziti je v use-casu (rate limit) a v domene (delkove limity).
 */
app.http('contact', {
  methods: ['POST', 'OPTIONS'],
  route: 'contact',
  authLevel: 'anonymous',
  handler: publicEndpoint(async (request) => {
    await submitContactMessage(contactDeps(), {
      raw: await readJson(request),
      sourceIp: clientIp(request),
    });

    return json(request, 202, { message: 'Zprava byla odeslana.' });
  }),
});
