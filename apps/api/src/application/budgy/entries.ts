import type { BudgetEntry as EntryData, BudgetEntryInput } from '@fridrich/budgy-shared';
import { entriesKeys } from '@fridrich/budgy-shared';
import { DomainError } from '../../domain/shared/DomainError.js';
import { BudgetEntry } from '../../domain/budgy/entry/BudgetEntry.js';
import type { BudgyDeps } from './deps.js';

/*
 * Use-casy subdomény `entries`.
 *
 * Rozpočet patří k účtu, žádné sdílení zatím není – proto se všude pracuje
 * jen s `userId` a cizí položku nelze ani přečíst.
 */

export async function listEntries(deps: BudgyDeps, userId: string): Promise<EntryData[]> {
  const entries = await deps.entries.listForUser(userId);
  return entries.map((entry) => entry.toState());
}

async function loadEntry(deps: BudgyDeps, entryId: string, userId: string): Promise<BudgetEntry> {
  const entry = await deps.entries.findById(userId, entryId);
  if (!entry) throw DomainError.notFound(entriesKeys.entryNotFound);

  return entry;
}

export async function createEntry(
  deps: BudgyDeps,
  input: BudgetEntryInput,
  userId: string,
): Promise<EntryData> {
  const entry = BudgetEntry.create({
    id: deps.ids.next(),
    userId,
    entry: input,
    clock: deps.clock,
  });

  await deps.entries.save(entry);
  return entry.toState();
}

export async function updateEntry(
  deps: BudgyDeps,
  entryId: string,
  input: BudgetEntryInput,
  userId: string,
): Promise<EntryData> {
  const entry = await loadEntry(deps, entryId, userId);
  entry.update(input, deps.clock);

  await deps.entries.save(entry);
  return entry.toState();
}

export async function deleteEntry(
  deps: BudgyDeps,
  entryId: string,
  userId: string,
): Promise<void> {
  const entry = await loadEntry(deps, entryId, userId);
  await deps.entries.delete(entry.userId, entry.id);
}

/**
 * Smazání účtu – port `UserDataEraser` (CLAUDE.md, pravidlo 27).
 *
 * Rozpočet nikdo jiný nevidí, takže se maže celý bez ptaní.
 */
export async function eraseUserBudgyData(
  deps: BudgyDeps,
  user: { id: string },
): Promise<void> {
  await deps.entries.deleteAllForUser(user.id);
}
