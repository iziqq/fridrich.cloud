import type {
  CoupleInput,
  WeddingDetail,
  WeddingInput,
  WeddingSettingsInput,
  WeddingSummary,
} from '@fridrich/weddy-shared';
import {
  calculateBudget,
  calculateGuestStats,
  countDecidedSections,
  daysUntil,
  weddingKeys,
} from '@fridrich/weddy-shared';
import { DomainError } from '../../domain/shared/DomainError.js';
import { Wedding } from '../../domain/weddy/wedding/Wedding.js';
import type { WeddyDeps } from './deps.js';

/*
 * Use-casy subdomény `wedding` – plánování jako celek a snoubenci.
 */

/**
 * Načte svatbu a rovnou ověří, že na ni uživatel má právo.
 *
 * Používají to use-casy všech subdomén weddy – kontrola přístupu tak nemůže
 * nikde vypadnout tím, že by ji někdo zapomněl napsat do endpointu. `access`
 * říká, na co: `read` stačí viewerovi, `edit` chce admina nebo managera,
 * `settings` jen admina.
 */
export type WeddyAccess = 'read' | 'edit' | 'settings';

export async function loadWeddingFor(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
  access: WeddyAccess = 'read',
): Promise<Wedding> {
  const wedding = await deps.weddings.findById(weddingId);
  if (!wedding) throw DomainError.notFound(weddingKeys.notFound);

  if (access === 'settings') wedding.assertCanManageSettings(userId);
  else if (access === 'edit') wedding.assertCanEdit(userId);
  else wedding.assertCanRead(userId);

  return wedding;
}

/** Seznam plánování pro dashboard včetně souhrnu hostů a rozpočtu. */
export async function listWeddings(deps: WeddyDeps, userId: string): Promise<WeddingSummary[]> {
  const weddings = await deps.weddings.listForMember(userId);

  return Promise.all(
    weddings.map(async (wedding) => {
      const [guests, items, bundles] = await Promise.all([
        deps.guests.list(wedding.id),
        deps.items.list(wedding.id),
        deps.bundles.list(wedding.id),
      ]);

      const itemStates = items.map((item) => item.toState());
      const bundleStates = bundles.map((bundle) => bundle.toState());
      const stats = calculateGuestStats(guests.map((guest) => guest.toState()));
      const budget = calculateBudget(itemStates, bundleStates);

      const summary: WeddingSummary = {
        ...wedding.toPublic(),
        guestCount: stats.total,
        acceptedGuestCount: stats.accepted,
        budgetTotal: budget.total,
        decidedSectionCount: countDecidedSections(itemStates, bundleStates),
        role: wedding.assertCanRead(userId),
      };

      const days = daysUntil(wedding.weddingDate, deps.clock.now());
      if (days !== undefined) summary.daysUntilWedding = days;

      return summary;
    }),
  );
}

/** Detail plánování i s rolí volajícího – podle ní frontend skrývá ovládání. */
export async function getWedding(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
): Promise<WeddingDetail> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  return withRole(wedding, userId);
}

function withRole(wedding: Wedding, userId: string): WeddingDetail {
  return { ...wedding.toPublic(), role: wedding.assertCanRead(userId) };
}

export async function createWedding(
  deps: WeddyDeps,
  input: WeddingInput,
  userId: string,
): Promise<WeddingDetail> {
  const wedding = Wedding.create({
    id: deps.ids.next(),
    wedding: input,
    creatorId: userId,
    clock: deps.clock,
  });

  await deps.weddings.save(wedding);
  return withRole(wedding, userId);
}

/** Snoubenci z obrazovky Snoubenci – smí admin i manager. */
export async function updateCouple(
  deps: WeddyDeps,
  weddingId: string,
  input: CoupleInput,
  userId: string,
): Promise<WeddingDetail> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'edit');
  wedding.updateCouple(input, deps.clock);

  await deps.weddings.save(wedding);
  return withRole(wedding, userId);
}

/** Název a datum z Nastavení – jen admin. */
export async function updateWeddingSettings(
  deps: WeddyDeps,
  weddingId: string,
  input: WeddingSettingsInput,
  userId: string,
): Promise<WeddingDetail> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'settings');
  wedding.updateSettings(input, deps.clock);

  await deps.weddings.save(wedding);
  return withRole(wedding, userId);
}

/** Smaže plánování včetně hostů, položek a čekajících pozvánek – jen admin. */
export async function deleteWedding(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
): Promise<void> {
  const wedding = await loadWeddingFor(deps, weddingId, userId, 'settings');
  await deleteWithContent(deps, wedding);
}

/**
 * Smaže data uživatele v IziWeddy – volá se při smazání jeho účtu.
 *
 * Plánování, které patří jen jemu, se smaže celé včetně hostů a položek.
 * Ze sdíleného plánování se jen odebere; odcházel-li admin, roli převezme
 * někdo další (`Wedding.leave`), ať plánování nezůstane bez správce.
 */
export async function eraseUserWeddyData(
  deps: WeddyDeps,
  user: { id: string; email: string },
): Promise<void> {
  const weddings = await deps.weddings.listForMember(user.id);

  for (const wedding of weddings) {
    if (wedding.isOnlyMember(user.id)) {
      await deleteWithContent(deps, wedding);
    } else {
      wedding.leave(user.id, deps.clock);
      await deps.weddings.save(wedding);
    }
  }

  // Pozvánky na jeho adresu už nemají komu naskočit.
  for (const invitation of await deps.invitations.listForEmail(user.email)) {
    await deps.invitations.delete(invitation.weddingId, invitation.id);
  }
}

/**
 * Smaže svatbu i s obsahem.
 *
 * Cosmos DB nezná transakce napříč kontejnery, takže pořadí je schválně
 * takové, že se svatba maže poslední. Kdyby to spadlo uprostřed, zůstane
 * dohledatelná a smazání jde zopakovat – opačné pořadí by nechalo osiřelá
 * data bez vazby na cokoli.
 */
async function deleteWithContent(deps: WeddyDeps, wedding: Wedding): Promise<void> {
  await Promise.all([
    deps.guests.deleteAllForWedding(wedding.id),
    deps.items.deleteAllForWedding(wedding.id),
    deps.bundles.deleteAllForWedding(wedding.id),
    deps.invitations.deleteAllForWedding(wedding.id),
  ]);

  await deps.weddings.delete(wedding.id);
}
