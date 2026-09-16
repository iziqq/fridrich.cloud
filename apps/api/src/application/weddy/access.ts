import type { Locale } from '@fridrich/shared';
import {
  weddingKeys,
  type InvitableRole,
  type InviteToWeddingInput,
  type WeddingAccess,
  type WeddingMember,
} from '@fridrich/weddy-shared';
import { DomainError } from '../../domain/shared/DomainError.js';
import { WeddingInvitation } from '../../domain/weddy/wedding/WeddingInvitation.js';
import { weddingAccessGrantedEmail, weddingInvitationEmail } from './emails.js';
import { loadWeddingFor } from './wedding.js';
import type { WeddyDeps } from './deps.js';

/*
 * Use-casy přístupů k plánování – kdo ho vidí a co s ním smí.
 *
 * Admin je zakladatel a jediný sem má přístup. Koho zve, toho buď rovnou
 * přidá (účet existuje), nebo mu nechá čekat pozvánku, která se promění
 * v členství po registraci (`claimWeddingInvitations`).
 */

/** Seznam členů i čekajících pozvánek pro obrazovku Nastavení → Přístup. */
export async function listWeddingAccess(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
): Promise<WeddingAccess> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'settings');

  const users = await deps.directory.findByIds(wedding.members.map((member) => member.userId));
  const byId = new Map(users.map((user) => [user.id, user]));

  const members: WeddingMember[] = wedding.members.map((member) => {
    const user = byId.get(member.userId);

    return {
      userId: member.userId,
      // Smazaný účet by jinak zmizel ze seznamu, přitom přístup pořád drží.
      displayName: user?.displayName ?? '',
      email: user?.email ?? '',
      role: member.role,
      addedAt: member.addedAt,
    };
  });

  const invitations = await deps.invitations.listForWedding(weddingId);

  return { members, invitations: invitations.map((invitation) => invitation.toPublic()) };
}

export interface InviteCommand extends InviteToWeddingInput {
  /** Jazyk požadavku – pozvaný ještě nemusí mít účet, jazyk účtu tedy neznáme. */
  locale: Locale;
}

/**
 * Pozve člověka do plánování.
 *
 * Kdo má účet, dostane přístup hned a jen se to dozví e-mailem. Kdo ho nemá,
 * dostane pozvánku s odkazem na registraci; přístup mu naskočí, jakmile se
 * zaregistruje na tutéž adresu.
 */
export async function inviteToWedding(
  deps: WeddyDeps,
  weddingId: string,
  command: InviteCommand,
  userId: string,
): Promise<WeddingAccess> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'settings');

  const inviter = await deps.directory.findByIds([userId]);
  const inviterName = inviter[0]?.displayName ?? '';
  if (inviter[0]?.email === command.email) {
    throw DomainError.validation([{ field: 'email', message: weddingKeys.cannotInviteSelf }]);
  }

  const invited = await deps.directory.findByEmail(command.email);

  if (invited) {
    wedding.addMember(invited.id, command.role, deps.clock);
    await deps.weddings.save(wedding);

    await deps.email.send(
      weddingAccessGrantedEmail(
        invited.email,
        {
          weddingTitle: wedding.title,
          inviterName,
          role: command.role,
          weddingUrl: `${deps.appUrl}/izi-weddy/weddings/${wedding.id}/couple`,
        },
        command.locale,
      ),
    );

    return listWeddingAccess(deps, weddingId, userId);
  }

  const waiting = await deps.invitations.listForEmail(command.email);
  if (waiting.some((invitation) => invitation.weddingId === weddingId)) {
    throw DomainError.conflict(weddingKeys.alreadyInvited);
  }

  const invitation = WeddingInvitation.issue({
    id: deps.ids.next(),
    weddingId,
    email: command.email,
    role: command.role,
    clock: deps.clock,
  });
  await deps.invitations.save(invitation);

  await deps.email.send(
    weddingInvitationEmail(
      invitation.email,
      {
        weddingTitle: wedding.title,
        inviterName,
        role: command.role,
        registerUrl: `${deps.appUrl}/registrace`,
      },
      command.locale,
    ),
  );

  return listWeddingAccess(deps, weddingId, userId);
}

export async function changeWeddingMemberRole(
  deps: WeddyDeps,
  weddingId: string,
  memberId: string,
  role: InvitableRole,
  userId: string,
): Promise<WeddingAccess> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'settings');
  wedding.changeMemberRole(memberId, role, deps.clock);

  await deps.weddings.save(wedding);
  return listWeddingAccess(deps, weddingId, userId);
}

export async function removeWeddingMember(
  deps: WeddyDeps,
  weddingId: string,
  memberId: string,
  userId: string,
): Promise<WeddingAccess> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'settings');
  wedding.removeMember(memberId, deps.clock);

  await deps.weddings.save(wedding);
  return listWeddingAccess(deps, weddingId, userId);
}

export async function cancelWeddingInvitation(
  deps: WeddyDeps,
  weddingId: string,
  invitationId: string,
  userId: string,
): Promise<WeddingAccess> {
  await loadWeddingFor(deps, weddingId, userId, 'settings');

  const invitation = await deps.invitations.findById(weddingId, invitationId);
  if (!invitation) throw DomainError.notFound(weddingKeys.invitationNotFound);

  await deps.invitations.delete(weddingId, invitationId);
  return listWeddingAccess(deps, weddingId, userId);
}

/**
 * Promění čekající pozvánky v členství – volá se po registraci účtu.
 *
 * Doména identity o plánovači nic neví; zavolá jen port, který jí
 * `container.ts` podstrčí (CLAUDE.md, pravidlo 3). Prošlá pozvánka se místo
 * přidání jen uklidí.
 */
export async function claimWeddingInvitations(
  deps: WeddyDeps,
  user: { id: string; email: string },
): Promise<void> {
  const invitations = await deps.invitations.listForEmail(user.email);

  for (const invitation of invitations) {
    const wedding = await deps.weddings.findById(invitation.weddingId);

    if (wedding && !invitation.isExpired(deps.clock) && !wedding.roleOf(user.id)) {
      wedding.addMember(user.id, invitation.role, deps.clock);
      await deps.weddings.save(wedding);
    }

    await deps.invitations.delete(invitation.weddingId, invitation.id);
  }
}
