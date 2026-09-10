import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { HttpRequest } from '@azure/functions';
import { clientIp } from '../src/http/responses.js';
import { readCookie, sessionCookie, clearedSessionCookie } from '../src/http/cookies.js';

/**
 * Testy HTTP vrstvy zůstávají na úrovni mapování požadavku a odpovědi –
 * business logika je pokrytá testy domény (CLAUDE.md, Testing).
 */

/** Minimální požadavek – stačí hlavičky, nic jiného testované funkce nečtou. */
function requestWith(headers: Record<string, string>): HttpRequest {
  const lookup = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));

  return {
    headers: { get: (name: string) => lookup.get(name.toLowerCase()) ?? null },
  } as unknown as HttpRequest;
}

describe('clientIp', () => {
  it('upřednostní hlavičku od platformy, kterou nelze podvrhnout', () => {
    const request = requestWith({
      'x-azure-clientip': '203.0.113.9',
      'x-forwarded-for': '1.2.3.4',
    });

    assert.equal(clientIp(request), '203.0.113.9');
  });

  it('bere z x-forwarded-for poslední položku, ne první', () => {
    // Útočník pošle vlastní hodnotu, Azure za ni připojí skutečnou adresu.
    const request = requestWith({ 'x-forwarded-for': '9.9.9.9, 203.0.113.9' });

    assert.equal(clientIp(request), '203.0.113.9');
  });

  it('podvržená hlavička nezmění klíč rate limitu', () => {
    const first = clientIp(requestWith({ 'x-forwarded-for': 'aaa, 203.0.113.9' }));
    const second = clientIp(requestWith({ 'x-forwarded-for': 'bbb, 203.0.113.9' }));

    assert.equal(first, second);
  });

  it('odřízne port, který Azure k adrese připojuje', () => {
    assert.equal(clientIp(requestWith({ 'x-forwarded-for': '203.0.113.9:51234' })), '203.0.113.9');
  });

  it('bez hlaviček vrátí zástupnou hodnotu místo pádu', () => {
    assert.equal(clientIp(requestWith({})), 'unknown');
  });
});

describe('session cookie', () => {
  const expiresAt = new Date(Date.now() + 60_000).toISOString();

  it('je HttpOnly a SameSite=Lax', () => {
    const cookie = sessionCookie('tajny-token', expiresAt);

    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
  });

  it('mimo produkci není Secure, jinak by ji localhost zahodil', () => {
    assert.doesNotMatch(sessionCookie('tajny-token', expiresAt), /Secure/);
  });

  it('vypršelá platnost dá Max-Age nula, ne záporné číslo', () => {
    const past = new Date(Date.now() - 60_000).toISOString();

    assert.match(sessionCookie('tajny-token', past), /Max-Age=0/);
  });

  it('odhlášení posílá prázdnou cookie s nulovou platností', () => {
    const cookie = clearedSessionCookie();

    assert.match(cookie, /Max-Age=0/);
    assert.match(cookie, /HttpOnly/);
  });
});

describe('readCookie', () => {
  it('najde hodnotu mezi ostatními cookies', () => {
    const request = requestWith({ cookie: 'jina=1; fc_session=abc123; dalsi=2' });

    assert.equal(readCookie(request, 'fc_session'), 'abc123');
  });

  it('nenechá se zmást cookie s podobným názvem', () => {
    const request = requestWith({ cookie: 'fc_session_old=spatne; fc_session=spravne' });

    assert.equal(readCookie(request, 'fc_session'), 'spravne');
  });

  it('bez hlavičky vrátí undefined', () => {
    assert.equal(readCookie(requestWith({}), 'fc_session'), undefined);
  });
});
