import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  cancelWeddingInvitation,
  changeWeddingMemberRole,
  claimWeddingInvitations,
  inviteToWedding,
  listWeddingAccess,
  removeWeddingMember,
} from '../src/application/weddy/access.js';
import { createGuest, listGuests } from '../src/application/weddy/guests.js';
import {
  createWedding,
  deleteWedding,
  getWedding,
  updateCouple,
  updateWeddingSettings,
} from '../src/application/weddy/wedding.js';
import { isDomainError } from '../src/domain/shared/DomainError.js';
import { validWedding, weddyTestDeps, type WeddyTestContext } from './fakes.js';

/**
 * Přístupy k plánování: admin je zakladatel, manager mění obsah, viewer čte.
 * Pozvánka na adresu bez účtu čeká, dokud se k ní někdo nezaregistruje.
 */

const ADMIN = 'user-admin';
const GUEST_USER = 'user-jana';

const jana = { id: GUEST_USER, email: 'jana@example.com', displayName: 'Jana Nováková' };

async function withWedding(): Promise<{ deps: WeddyTestContext; weddingId: string }> {
  const deps = weddyTestDeps();
  deps.directory.add({ id: ADMIN, email: 'admin@example.com', displayName: 'Libor Fridrich' });

  const wedding = await createWedding(deps, validWedding, ADMIN);
  return { deps, weddingId: wedding.id };
}

/** Plánování, do kterého už někdo patří v dané roli. */
async function withMember(role: 'manager' | 'viewer') {
  const { deps, weddingId } = await withWedding();
  deps.directory.add(jana);
  await inviteToWedding(deps, weddingId, { email: jana.email, role, locale: 'cs' }, ADMIN);

  return { deps, weddingId };
}

describe('role v plánování', () => {
  it('manager smí měnit obsah, ale ne nastavení', async () => {
    const { deps, weddingId } = await withMember('manager');

    await createGuest(
      deps,
      weddingId,
      { firstName: 'Eva', lastName: 'Malá', side: 'bride' },
      GUEST_USER,
    );
    await updateCouple(
      deps,
      weddingId,
      { groom: validWedding.groom, bride: validWedding.bride },
      GUEST_USER,
    );

    assert.equal(deps.guests.items.size, 1);
    await assert.rejects(
      updateWeddingSettings(deps, weddingId, { title: 'Jinak' }, GUEST_USER),
      (error) => isDomainError(error) && error.kind === 'forbidden',
    );
    await assert.rejects(
      listWeddingAccess(deps, weddingId, GUEST_USER),
      (error) => isDomainError(error) && error.kind === 'forbidden',
    );
    await assert.rejects(deleteWedding(deps, weddingId, GUEST_USER), isDomainError);
  });

  it('viewer plánování vidí, ale nic nezmění', async () => {
    const { deps, weddingId } = await withMember('viewer');

    const wedding = await getWedding(deps, weddingId, GUEST_USER);
    assert.equal(wedding.role, 'viewer');
    assert.equal((await listGuests(deps, weddingId, GUEST_USER, {})).guests.length, 0);

    await assert.rejects(
      createGuest(deps, weddingId, { firstName: 'Eva', side: 'bride' }, GUEST_USER),
      (error) => isDomainError(error) && error.kind === 'forbidden',
    );
    await assert.rejects(
      updateCouple(
        deps,
        weddingId,
        { groom: validWedding.groom, bride: validWedding.bride },
        GUEST_USER,
      ),
      isDomainError,
    );
  });

  it('cizí uživatel plánování ani nevidí', async () => {
    const { deps, weddingId } = await withWedding();

    await assert.rejects(
      getWedding(deps, weddingId, 'user-cizi'),
      (error) => isDomainError(error) && error.kind === 'forbidden',
    );
  });

  it('roli admina nejde změnit ani odebrat', async () => {
    const { deps, weddingId } = await withWedding();

    await assert.rejects(
      changeWeddingMemberRole(deps, weddingId, ADMIN, 'viewer', ADMIN),
      (error) => isDomainError(error) && error.kind === 'conflict',
    );
    await assert.rejects(
      removeWeddingMember(deps, weddingId, ADMIN, ADMIN),
      (error) => isDomainError(error) && error.kind === 'conflict',
    );
  });

  it('nastavení mění název a datum, snoubenci zůstanou', async () => {
    const { deps, weddingId } = await withWedding();

    const updated = await updateWeddingSettings(
      deps,
      weddingId,
      { title: 'Svatba na zámku', weddingDate: '2027-06-12' },
      ADMIN,
    );

    assert.equal(updated.title, 'Svatba na zámku');
    assert.equal(updated.weddingDate, '2027-06-12');
    assert.equal(updated.groom.firstName, validWedding.groom.firstName);
  });
});

describe('pozvání do plánování', () => {
  it('existující účet dostane přístup hned a dozví se to e-mailem', async () => {
    const { deps, weddingId } = await withWedding();
    deps.directory.add(jana);

    const access = await inviteToWedding(
      deps,
      weddingId,
      { email: jana.email, role: 'manager', locale: 'cs' },
      ADMIN,
    );

    assert.deepEqual(
      access.members.map((member) => [member.email, member.role]),
      [['admin@example.com', 'admin'], [jana.email, 'manager']],
    );
    assert.equal(access.invitations.length, 0);
    assert.equal(deps.email.last?.to, jana.email);
    assert.match(deps.email.last?.subject ?? '', /přístup/i);
  });

  it('adresa bez účtu dostane čekající pozvánku', async () => {
    const { deps, weddingId } = await withWedding();

    const access = await inviteToWedding(
      deps,
      weddingId,
      { email: 'teta@example.com', role: 'viewer', locale: 'cs' },
      ADMIN,
    );

    assert.equal(access.members.length, 1);
    assert.deepEqual(
      access.invitations.map((invitation) => [invitation.email, invitation.role]),
      [['teta@example.com', 'viewer']],
    );
    assert.match(deps.email.last?.subject ?? '', /Pozvánka/);
    // Pozvánka nesmí prozradit nic, čím by šlo plánování otevřít bez účtu.
    assert.doesNotMatch(deps.email.last?.text ?? '', new RegExp(weddingId));
  });

  it('po registraci se pozvánka promění v přístup', async () => {
    const { deps, weddingId } = await withWedding();
    await inviteToWedding(
      deps,
      weddingId,
      { email: jana.email, role: 'manager', locale: 'cs' },
      ADMIN,
    );

    deps.directory.add(jana);
    await claimWeddingInvitations(deps, { id: GUEST_USER, email: jana.email });

    const access = await listWeddingAccess(deps, weddingId, ADMIN);
    assert.deepEqual(
      access.members.map((member) => [member.userId, member.role]),
      [[ADMIN, 'admin'], [GUEST_USER, 'manager']],
    );
    assert.equal(access.invitations.length, 0);
    assert.equal(deps.invitations.items.size, 0);
  });

  it('prošlá pozvánka přístup nedá, jen se uklidí', async () => {
    const { deps, weddingId } = await withWedding();
    await inviteToWedding(
      deps,
      weddingId,
      { email: jana.email, role: 'manager', locale: 'cs' },
      ADMIN,
    );

    deps.clock.advance(31 * 24 * 60 * 60 * 1000);
    deps.directory.add(jana);
    await claimWeddingInvitations(deps, { id: GUEST_USER, email: jana.email });

    const access = await listWeddingAccess(deps, weddingId, ADMIN);
    assert.equal(access.members.length, 1);
    assert.equal(deps.invitations.items.size, 0);
  });

  it('stejnou adresu nejde pozvat dvakrát', async () => {
    const { deps, weddingId } = await withWedding();
    await inviteToWedding(
      deps,
      weddingId,
      { email: 'teta@example.com', role: 'viewer', locale: 'cs' },
      ADMIN,
    );

    await assert.rejects(
      inviteToWedding(deps, weddingId, { email: 'teta@example.com', role: 'viewer', locale: 'cs' }, ADMIN),
      (error) => isDomainError(error) && error.kind === 'conflict',
    );
  });

  it('člena, který už přístup má, nejde pozvat znovu', async () => {
    const { deps, weddingId } = await withMember('viewer');

    await assert.rejects(
      inviteToWedding(deps, weddingId, { email: jana.email, role: 'manager', locale: 'cs' }, ADMIN),
      (error) => isDomainError(error) && error.kind === 'conflict',
    );
  });

  it('sebe zvát nejde', async () => {
    const { deps, weddingId } = await withWedding();

    await assert.rejects(
      inviteToWedding(deps, weddingId, { email: 'admin@example.com', role: 'manager', locale: 'cs' }, ADMIN),
      (error) => isDomainError(error) && error.kind === 'validation',
    );
  });

  it('admin změní roli i odebere přístup', async () => {
    const { deps, weddingId } = await withMember('manager');

    const afterChange = await changeWeddingMemberRole(deps, weddingId, GUEST_USER, 'viewer', ADMIN);
    assert.equal(afterChange.members[1]?.role, 'viewer');

    const afterRemove = await removeWeddingMember(deps, weddingId, GUEST_USER, ADMIN);
    assert.equal(afterRemove.members.length, 1);
    await assert.rejects(getWedding(deps, weddingId, GUEST_USER), isDomainError);
  });

  it('admin zruší čekající pozvánku', async () => {
    const { deps, weddingId } = await withWedding();
    const access = await inviteToWedding(
      deps,
      weddingId,
      { email: 'teta@example.com', role: 'viewer', locale: 'cs' },
      ADMIN,
    );
    const invitationId = access.invitations[0]?.id;
    assert.ok(invitationId);

    const after = await cancelWeddingInvitation(deps, weddingId, invitationId, ADMIN);
    assert.equal(after.invitations.length, 0);
  });

  it('smazání plánování zahodí i čekající pozvánky', async () => {
    const { deps, weddingId } = await withWedding();
    await inviteToWedding(
      deps,
      weddingId,
      { email: 'teta@example.com', role: 'viewer', locale: 'cs' },
      ADMIN,
    );

    await deleteWedding(deps, weddingId, ADMIN);

    assert.equal(deps.invitations.items.size, 0);
  });
});
