import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LOGIN_CODE_LENGTH } from '@fridrich/shared';
import { fingerprint, tokenGenerator } from '../src/infrastructure/crypto.js';

/**
 * Testy skutečného generátoru.
 *
 * Use-casy běží proti předvídatelné náhradě, takže tohle je jediné místo,
 * kde se ověří, že produkční implementace dodržuje tvar, na kterém doména
 * staví – hlavně že kód má vždy šest číslic včetně vedoucích nul.
 */
describe('tokenGenerator', () => {
  it('vyrábí kódy o pevné délce, jen z číslic', () => {
    for (let i = 0; i < 500; i += 1) {
      const code = tokenGenerator.generateCode();
      assert.equal(code.length, LOGIN_CODE_LENGTH);
      assert.match(code, /^\d+$/);
    }
  });

  it('kódy se neopakují dokola', () => {
    const codes = new Set(Array.from({ length: 200 }, () => tokenGenerator.generateCode()));
    // Náhodný generátor občas trefí duplicitu, ale 200 hodnot z milionu
    // nesmí spadnout do hrstky – to by znamenalo zaseknutý zdroj náhody.
    assert.ok(codes.size > 190, `příliš mnoho duplicit: ${codes.size} ze 200`);
  });

  it('tokeny do odkazů jsou pokaždé jiné a v databázi leží jen otisk', () => {
    const first = tokenGenerator.generate();
    const second = tokenGenerator.generate();

    assert.notEqual(first.token, second.token);
    assert.notEqual(first.tokenHash, first.token);
    assert.equal(first.tokenHash, tokenGenerator.hash(first.token));
  });

  it('matches porovná hodnotu s otiskem', () => {
    const hash = tokenGenerator.hash('id-1:123456');

    assert.ok(tokenGenerator.matches(hash, 'id-1:123456'));
    assert.ok(!tokenGenerator.matches(hash, 'id-1:123457'));
    // Stejný kód pod jinou výzvou nesmí projít – proto se hashuje spolu s id.
    assert.ok(!tokenGenerator.matches(hash, 'id-2:123456'));
  });
});

describe('otisk údaje (fingerprint)', () => {
  const ip = '198.51.100.7';

  it('z téže hodnoty vyjde týž otisk, z jiné jiný', () => {
    assert.equal(fingerprint.of(ip), fingerprint.of(ip));
    assert.notEqual(fingerprint.of(ip), fingerprint.of('198.51.100.8'));
  });

  it('otisk původní hodnotu neobsahuje', () => {
    const hash = fingerprint.of('jan@example.com');

    assert.doesNotMatch(hash, /jan|example/u);
    assert.match(hash, /^[0-9a-f]{64}$/u, 'HMAC-SHA256 v šestnáctkové soustavě');
  });

  it('zápis adresy nerozhoduje – porovnává se tatáž adresa', () => {
    assert.equal(fingerprint.of('  Jan@Example.com '), fingerprint.of('jan@example.com'));
  });
});
