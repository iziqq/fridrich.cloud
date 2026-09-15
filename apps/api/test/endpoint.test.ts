import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { HttpRequest, InvocationContext } from '@azure/functions';
import * as v from 'valibot';
import { submitContactMessageEndpoint } from '../src/endpoints/contact/submitContactMessage.endpoint.js';
import { DomainError } from '../src/domain/shared/DomainError.js';
import { defineEndpoint } from '../src/http/endpoint.js';

/**
 * Obálka endpointu – jen mapování požadavku a odpovědi.
 *
 * Business logika je pokrytá testy domény a use-casů; tady se ověřuje, že
 * neplatný vstup skončí jako 400 s detaily po polích dřív, než se sáhne na
 * use-case, a že doménová chyba dostane správný stavový kód.
 */

function fakeRequest(input: {
  method?: string;
  url?: string;
  body?: unknown;
  params?: Record<string, string>;
}): HttpRequest {
  return {
    method: input.method ?? 'POST',
    url: input.url ?? 'http://localhost:7071/api/test',
    params: input.params ?? {},
    headers: new Headers(),
    json: async () => input.body,
  } as unknown as HttpRequest;
}

const context = { error: () => undefined } as unknown as InvocationContext;

describe('defineEndpoint', () => {
  const echo = defineEndpoint({
    name: 'echo',
    method: 'POST',
    route: 'test/{id}',
    access: 'public',
    params: v.object({ id: v.string() }),
    body: v.object({ name: v.pipe(v.string('Vyplňte jméno'), v.nonEmpty('Vyplňte jméno')) }),
    response: v.object({ id: v.string(), name: v.string() }),
    async handle({ params, body }) {
      return { status: 200, body: { id: params.id, name: body.name } };
    },
  });

  it('předá handleru rozparsované parametry i tělo', async () => {
    const response = await echo.invoke(
      fakeRequest({ params: { id: 'a1' }, body: { name: 'Eva' } }),
      context,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(response.jsonBody, { id: 'a1', name: 'Eva' });
  });

  it('neplatné tělo vrátí 400 s chybou u pole', async () => {
    const response = await echo.invoke(
      fakeRequest({ params: { id: 'a1' }, body: { name: '' } }),
      context,
    );

    assert.equal(response.status, 400);
    assert.deepEqual(response.jsonBody, {
      error: 'ValidationError',
      message: 'Neplatná data',
      details: [{ field: 'name', message: 'Vyplňte jméno' }],
    });
  });

  it('doménovou chybu přeloží na stavový kód', async () => {
    const failing = defineEndpoint({
      name: 'failing',
      method: 'GET',
      route: 'failing',
      access: 'public',
      async handle() {
        throw DomainError.notFound('Plánování');
      },
    });

    const response = await failing.invoke(fakeRequest({ method: 'GET' }), context);
    assert.equal(response.status, 404);
  });

  it('neočekávaná výjimka skončí jako 500 bez textu chyby', async () => {
    const crashing = defineEndpoint({
      name: 'crashing',
      method: 'GET',
      route: 'crashing',
      access: 'public',
      async handle() {
        throw new Error('tajný detail o databázi');
      },
    });

    const response = await crashing.invoke(fakeRequest({ method: 'GET' }), context);

    assert.equal(response.status, 500);
    assert.doesNotMatch(JSON.stringify(response.jsonBody), /tajný detail/);
  });
});

describe('submitContactMessage.endpoint', () => {
  it('odmítne neplatnou zprávu dřív, než sáhne na databázi', async () => {
    const response = await submitContactMessageEndpoint.invoke(
      fakeRequest({ url: 'http://localhost:7071/api/contact', body: { name: 'Jan' } }),
      context,
    );

    assert.equal(response.status, 400);
  });
});
