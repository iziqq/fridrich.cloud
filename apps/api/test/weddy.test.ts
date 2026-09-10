import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateBudget, calculateGuestStats } from '@fridrich/weddy-shared';
import {
  changeGuestStatus,
  createGuest,
  deleteGuest,
  listGuests,
} from '../src/application/weddy/guests.js';
import { createItem, getBudget, listItems } from '../src/application/weddy/planning.js';
import {
  createWedding,
  deleteWedding,
  getWedding,
  listWeddings,
  updateWedding,
} from '../src/application/weddy/weddings.js';
import { isDomainError } from '../src/domain/shared/DomainError.js';
import { weddyTestDeps, validWedding, type WeddyTestContext } from './fakes.js';

const OWNER = 'user-1';
const STRANGER = 'user-2';

async function withWedding(): Promise<{ deps: WeddyTestContext; weddingId: string }> {
  const deps = weddyTestDeps();
  const wedding = await createWedding(deps, validWedding, OWNER);
  return { deps, weddingId: wedding.id };
}

describe('plánování svatby', () => {
  it('vytvoří svatbu a nastaví zakladatele jako vlastníka', async () => {
    const { deps, weddingId } = await withWedding();
    const state = deps.weddings.items.get(weddingId);

    assert.deepEqual(state?.ownerIds, [OWNER]);
  });

  it('odpověď pro frontend neobsahuje seznam vlastníků', async () => {
    const { deps, weddingId } = await withWedding();
    const wedding = await getWedding(deps, weddingId, OWNER);

    assert.equal('ownerIds' in wedding, false);
  });

  it('cizí uživatel svatbu nevidí', async () => {
    const { deps, weddingId } = await withWedding();

    await assert.rejects(
      getWedding(deps, weddingId, STRANGER),
      (error) => isDomainError(error) && error.kind === 'forbidden',
    );
  });

  it('cizí uživatel svatbu nesmí upravit ani smazat', async () => {
    const { deps, weddingId } = await withWedding();

    await assert.rejects(updateWedding(deps, weddingId, validWedding, STRANGER), isDomainError);
    await assert.rejects(deleteWedding(deps, weddingId, STRANGER), isDomainError);
  });

  it('neexistující svatba končí jako notFound', async () => {
    const deps = weddyTestDeps();

    await assert.rejects(
      getWedding(deps, 'neexistuje', OWNER),
      (error) => isDomainError(error) && error.kind === 'notFound',
    );
  });

  it('odmítne svatbu bez názvu', async () => {
    const deps = weddyTestDeps();

    await assert.rejects(
      createWedding(deps, { ...validWedding, title: '  ' }, OWNER),
      (error) => isDomainError(error) && error.kind === 'validation',
    );
  });

  it('odmítne neplatné datum svatby', async () => {
    const deps = weddyTestDeps();

    await assert.rejects(
      createWedding(deps, { ...validWedding, weddingDate: '2026-02-31' }, OWNER),
      isDomainError,
    );
  });

  it('smazání svatby odstraní i hosty a položky', async () => {
    const { deps, weddingId } = await withWedding();

    await createGuest(deps, weddingId, { firstName: 'Eva', lastName: 'Malá', side: 'bride' }, OWNER);
    await createItem(deps, weddingId, { category: 'flowers', name: 'Kytice', price: 3000 }, OWNER);

    await deleteWedding(deps, weddingId, OWNER);

    assert.equal(deps.guests.items.size, 0);
    assert.equal(deps.items.items.size, 0);
    assert.equal(deps.weddings.items.size, 0);
  });

  it('dashboard vrací souhrn hostů i rozpočtu', async () => {
    const { deps, weddingId } = await withWedding();

    await createGuest(
      deps,
      weddingId,
      { firstName: 'Eva', lastName: 'Malá', side: 'bride', status: 'accepted' },
      OWNER,
    );
    await createGuest(deps, weddingId, { firstName: 'Petr', lastName: 'Velký', side: 'groom' }, OWNER);
    await createItem(deps, weddingId, { category: 'flowers', name: 'Kytice', price: 3000 }, OWNER);

    const [summary] = await listWeddings(deps, OWNER);

    assert.equal(summary?.guestCount, 2);
    assert.equal(summary?.acceptedGuestCount, 1);
    assert.equal(summary?.budgetTotal, 3000);
  });

  it('dashboard ukazuje jen svatby daného uživatele', async () => {
    const { deps } = await withWedding();
    await createWedding(deps, validWedding, STRANGER);

    assert.equal((await listWeddings(deps, OWNER)).length, 1);
  });
});

describe('hosté', () => {
  it('nový host je ve stavu návrh a jako dospělý', async () => {
    const { deps, weddingId } = await withWedding();

    const guest = await createGuest(
      deps,
      weddingId,
      { firstName: 'Eva', lastName: 'Malá', side: 'bride' },
      OWNER,
    );

    assert.equal(guest.status, 'draft');
    assert.equal(guest.ageGroup, 'adult');
  });

  it('odmítne hosta bez strany', async () => {
    const { deps, weddingId } = await withWedding();

    await assert.rejects(
      createGuest(deps, weddingId, { firstName: 'Eva', lastName: 'Malá' }, OWNER),
      isDomainError,
    );
  });

  it('dovolí i přechod stavu proti běžnému toku, aby šla opravit chyba', async () => {
    const { deps, weddingId } = await withWedding();
    const guest = await createGuest(
      deps,
      weddingId,
      { firstName: 'Eva', lastName: 'Malá', side: 'bride', status: 'rejected' },
      OWNER,
    );

    const updated = await changeGuestStatus(
      deps,
      weddingId,
      guest.id,
      { status: 'accepted' },
      OWNER,
    );

    assert.equal(updated.status, 'accepted');
  });

  it('statistiky se počítají ze všech hostů, filtr je neovlivní', async () => {
    const { deps, weddingId } = await withWedding();

    await createGuest(
      deps,
      weddingId,
      { firstName: 'Eva', lastName: 'Malá', side: 'bride', status: 'accepted' },
      OWNER,
    );
    await createGuest(deps, weddingId, { firstName: 'Petr', lastName: 'Velký', side: 'groom' }, OWNER);

    const result = await listGuests(deps, weddingId, OWNER, { side: 'bride' });

    assert.equal(result.guests.length, 1);
    assert.equal(result.stats.total, 2);
  });

  it('cizí uživatel hosty nevidí', async () => {
    const { deps, weddingId } = await withWedding();

    await assert.rejects(listGuests(deps, weddingId, STRANGER, {}), isDomainError);
  });

  it('hosta z cizí svatby nelze smazat', async () => {
    const { deps, weddingId } = await withWedding();
    const guest = await createGuest(
      deps,
      weddingId,
      { firstName: 'Eva', lastName: 'Malá', side: 'bride' },
      OWNER,
    );

    await assert.rejects(deleteGuest(deps, weddingId, guest.id, STRANGER), isDomainError);
  });
});

describe('položky plánování a rozpočet', () => {
  it('nová položka je ve stavu návrh', async () => {
    const { deps, weddingId } = await withWedding();

    const item = await createItem(deps, weddingId, { category: 'dress', name: 'Šaty' }, OWNER);
    assert.equal(item.status, 'draft');
  });

  it('odmítne odkaz bez http/https', async () => {
    const { deps, weddingId } = await withWedding();

    await assert.rejects(
      createItem(
        deps,
        weddingId,
        { category: 'dress', name: 'Šaty', url: 'javascript:alert(1)' },
        OWNER,
      ),
      isDomainError,
    );
  });

  it('odmítne zápornou cenu', async () => {
    const { deps, weddingId } = await withWedding();

    await assert.rejects(
      createItem(deps, weddingId, { category: 'dress', name: 'Šaty', price: -5 }, OWNER),
      isDomainError,
    );
  });

  it('položky lze filtrovat podle sekce', async () => {
    const { deps, weddingId } = await withWedding();
    await createItem(deps, weddingId, { category: 'dress', name: 'Šaty' }, OWNER);
    await createItem(deps, weddingId, { category: 'flowers', name: 'Kytice' }, OWNER);

    const items = await listItems(deps, weddingId, OWNER, 'flowers');

    assert.equal(items.length, 1);
    assert.equal(items[0]?.name, 'Kytice');
  });

  it('rozpočet sečte položky a oddělí schválené od návrhů', async () => {
    const { deps, weddingId } = await withWedding();

    await createItem(
      deps,
      weddingId,
      { category: 'ceremonyVenue', name: 'Zámek', price: 45000, status: 'accepted' },
      OWNER,
    );
    await createItem(deps, weddingId, { category: 'flowers', name: 'Kytice', price: 15000 }, OWNER);
    await createItem(deps, weddingId, { category: 'dress', name: 'Šaty' }, OWNER);

    const budget = await getBudget(deps, weddingId, OWNER);

    assert.equal(budget.total, 60000);
    assert.equal(budget.accepted, 45000);
    assert.equal(budget.draft, 15000);
    assert.equal(budget.itemsWithoutPrice, 1);
    assert.equal(budget.byCategory.ceremonyVenue.accepted, 45000);
  });
});

describe('výpočty sdílené s frontendem', () => {
  it('rozpočet prázdného seznamu je nulový', () => {
    const budget = calculateBudget([]);

    assert.equal(budget.total, 0);
    assert.equal(budget.itemsWithoutPrice, 0);
  });

  it('odmítnutí hosté se nepočítají do celkového počtu', () => {
    const base = {
      weddingId: 'w1',
      firstName: 'A',
      lastName: 'B',
      ageGroup: 'adult',
      createdAt: '',
      updatedAt: '',
    } as const;

    const stats = calculateGuestStats([
      { ...base, id: '1', side: 'groom', status: 'accepted' },
      { ...base, id: '2', side: 'bride', status: 'rejected' },
    ]);

    assert.equal(stats.total, 1);
    assert.equal(stats.rejected, 1);
    assert.equal(stats.bride, 0);
  });
});
