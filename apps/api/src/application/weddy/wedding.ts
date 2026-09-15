import type { Wedding as WeddingData, WeddingInput, WeddingSummary } from '@fridrich/weddy-shared';
import { calculateBudget, calculateGuestStats, daysUntil } from '@fridrich/weddy-shared';
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
 * nikde vypadnout tím, že by ji někdo zapomněl napsat do endpointu.
 */
export async function loadWeddingFor(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
): Promise<Wedding> {
  const wedding = await deps.weddings.findById(weddingId);
  if (!wedding) throw DomainError.notFound('Plánování');

  wedding.assertAccessibleBy(userId);
  return wedding;
}

/** Seznam plánování pro dashboard včetně souhrnu hostů a rozpočtu. */
export async function listWeddings(deps: WeddyDeps, userId: string): Promise<WeddingSummary[]> {
  const weddings = await deps.weddings.listForOwner(userId);

  return Promise.all(
    weddings.map(async (wedding) => {
      const [guests, items] = await Promise.all([
        deps.guests.list(wedding.id),
        deps.items.list(wedding.id),
      ]);

      const stats = calculateGuestStats(guests.map((guest) => guest.toState()));
      const budget = calculateBudget(items.map((item) => item.toState()));

      const summary: WeddingSummary = {
        ...wedding.toPublic(),
        guestCount: stats.total,
        acceptedGuestCount: stats.accepted,
        budgetTotal: budget.total,
      };

      const days = daysUntil(wedding.weddingDate, deps.clock.now());
      if (days !== undefined) summary.daysUntilWedding = days;

      return summary;
    }),
  );
}

export async function getWedding(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
): Promise<WeddingData> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  return wedding.toPublic();
}

export async function createWedding(
  deps: WeddyDeps,
  input: WeddingInput,
  userId: string,
): Promise<WeddingData> {
  const wedding = Wedding.create({
    id: deps.ids.next(),
    wedding: input,
    ownerId: userId,
    clock: deps.clock,
  });

  await deps.weddings.save(wedding);
  return wedding.toPublic();
}

export async function updateWedding(
  deps: WeddyDeps,
  weddingId: string,
  input: WeddingInput,
  userId: string,
): Promise<WeddingData> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);
  wedding.update(input, deps.clock);

  await deps.weddings.save(wedding);
  return wedding.toPublic();
}

/**
 * Smaže plánování včetně hostů a položek.
 *
 * Cosmos DB nezná transakce napříč kontejnery, takže pořadí je schválně
 * takové, že se svatba maže poslední. Kdyby to spadlo uprostřed, zůstane
 * dohledatelná a smazání jde zopakovat – opačné pořadí by nechalo osiřelá
 * data bez vazby na cokoli.
 */
export async function deleteWedding(
  deps: WeddyDeps,
  weddingId: string,
  userId: string,
): Promise<void> {
  const wedding = await loadWeddingFor(deps, weddingId, userId);

  await Promise.all([
    deps.guests.deleteAllForWedding(wedding.id),
    deps.items.deleteAllForWedding(wedding.id),
  ]);

  await deps.weddings.delete(wedding.id);
}
