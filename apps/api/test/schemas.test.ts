import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AcceptTermsSchema,
  commonKeys,
  ContactMessageInputSchema,
  identityKeys,
  issuesToDetails,
} from '@fridrich/shared';
import {
  FamilyInputSchema,
  GuestInputSchema,
  PlanningItemInputSchema,
  WeddingInputSchema,
} from '@fridrich/weddy-shared';
import * as v from 'valibot';
import { validWedding } from './fakes.js';

/**
 * Pravidla vstupů ze sdíleného jádra domény.
 *
 * Tahle schémata parsuje endpoint na backendu i formulář na frontendu, takže
 * test tady hlídá obě strany najednou. Chyby musí nést cestu k poli, podle
 * které je formulář ukáže u správného vstupu.
 */

function fieldsOf(schema: v.GenericSchema, input: unknown): string[] {
  const result = v.safeParse(schema, input);
  assert.equal(result.success, false, 'vstup měl neprojít');
  return issuesToDetails(result.issues ?? []).map((detail) => detail.field);
}

describe('WeddingInputSchema', () => {
  it('platný vstup projde a texty ořízne', () => {
    const output = v.parse(WeddingInputSchema, { ...validWedding, title: '  Svatba  ' });
    assert.equal(output.title, 'Svatba');
  });

  it('odmítne svatbu bez názvu', () => {
    assert.deepEqual(fieldsOf(WeddingInputSchema, { ...validWedding, title: '  ' }), ['title']);
  });

  it('odmítne datum, které v kalendáři neexistuje', () => {
    assert.deepEqual(fieldsOf(WeddingInputSchema, { ...validWedding, weddingDate: '2026-02-31' }), [
      'weddingDate',
    ]);
  });

  it('chybu u snoubence hlásí s cestou k poli', () => {
    const input = { ...validWedding, groom: { firstName: '', lastName: 'Novák' } };
    assert.deepEqual(fieldsOf(WeddingInputSchema, input), ['groom.firstName']);
  });

  it('odmítne rok narození v budoucnu', () => {
    const input = {
      ...validWedding,
      bride: { ...validWedding.bride, birthYear: new Date().getUTCFullYear() + 1 },
    };
    assert.deepEqual(fieldsOf(WeddingInputSchema, input), ['bride.birthYear']);
  });

  it('prázdný nepovinný e-mail převede na undefined a platný normalizuje', () => {
    const empty = v.parse(WeddingInputSchema, {
      ...validWedding,
      groom: { ...validWedding.groom, email: '  ' },
    });
    const filled = v.parse(WeddingInputSchema, {
      ...validWedding,
      groom: { ...validWedding.groom, email: 'Petr@Example.com' },
    });

    assert.equal(empty.groom.email, undefined);
    assert.equal(filled.groom.email, 'petr@example.com');
  });
});

describe('GuestInputSchema', () => {
  it('odmítne hosta bez strany', () => {
    assert.deepEqual(fieldsOf(GuestInputSchema, { firstName: 'Eva', lastName: 'Malá' }), ['side']);
  });

  it('odmítne neznámý stav místo toho, aby ho potichu nahradil výchozím', () => {
    assert.deepEqual(
      fieldsOf(GuestInputSchema, { firstName: 'Eva', side: 'bride', status: 'maybe' }),
      ['status'],
    );
  });

  it('prázdné příjmení není chyba, jen chybí', () => {
    const output = v.parse(GuestInputSchema, { firstName: 'Eva', lastName: ' ', side: 'bride' });
    assert.equal(output.lastName, undefined);
  });
});

describe('FamilyInputSchema', () => {
  const members = [{ firstName: 'Josef', ageGroup: 'adult' }];

  it('odmítne rodinu bez členů', () => {
    assert.deepEqual(fieldsOf(FamilyInputSchema, { name: 'Novákovi', side: 'groom', members: [] }), [
      'members',
    ]);
  });

  it('odmítne rodinu bez názvu', () => {
    assert.deepEqual(fieldsOf(FamilyInputSchema, { name: '  ', side: 'groom', members }), ['name']);
  });

  it('chybu u člena hlásí s jeho pořadím', () => {
    const input = { name: 'Novákovi', side: 'groom', members: [...members, { firstName: '' }] };
    assert.deepEqual(fieldsOf(FamilyInputSchema, input), ['members.1.firstName']);
  });
});

describe('PlanningItemInputSchema', () => {
  it('odmítne odkaz bez http/https', () => {
    const input = { category: 'dress', name: 'Šaty', url: 'javascript:alert(1)' };
    assert.deepEqual(fieldsOf(PlanningItemInputSchema, input), ['url']);
  });

  it('odmítne zápornou cenu', () => {
    assert.deepEqual(
      fieldsOf(PlanningItemInputSchema, { category: 'dress', name: 'Šaty', price: -5 }),
      ['price'],
    );
  });

  it('cenu zaokrouhlí na celé koruny', () => {
    const output = v.parse(PlanningItemInputSchema, {
      category: 'dress',
      name: 'Šaty',
      price: 1999.6,
    });
    assert.equal(output.price, 2000);
  });

  it('odmítne neznámou sekci', () => {
    assert.deepEqual(fieldsOf(PlanningItemInputSchema, { category: 'cars', name: 'Auto' }), [
      'category',
    ]);
  });
});

describe('issuesToDetails', () => {
  it('úplně chybějící klíč hlásí obecným klíčem hlášky a u správného pole', () => {
    const result = v.safeParse(ContactMessageInputSchema, { email: 'jan@example.com' });
    const details = issuesToDetails(result.issues ?? []);

    assert.deepEqual(details[0], { field: 'name', message: commonKeys.fieldRequired });
  });
});

describe('ContactMessageInputSchema', () => {
  it('odmítne příliš krátkou zprávu i neplatný e-mail najednou', () => {
    const input = { name: 'Jan', email: 'bez-zavinace', message: 'Ahoj' };
    assert.deepEqual(fieldsOf(ContactMessageInputSchema, input), ['email', 'message']);
  });
});

describe('AcceptTermsSchema', () => {
  it('projde jen výslovný souhlas', () => {
    assert.equal(v.parse(AcceptTermsSchema, true), true);
  });

  it('nezaškrtnutý souhlas odmítne s klíčem hlášky pro formulář', () => {
    const result = v.safeParse(v.object({ acceptTerms: AcceptTermsSchema }), { acceptTerms: false });
    assert.equal(result.success, false);
    assert.deepEqual(issuesToDetails(result.issues ?? []), [
      { field: 'acceptTerms', message: identityKeys.acceptTermsRequired },
    ]);
  });
});
