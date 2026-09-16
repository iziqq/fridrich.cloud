import type { BudgetEntry as EntryData } from '@fridrich/budgy-shared';
import { CONTAINERS } from '../../config.js';
import { BudgetEntry } from '../../domain/budgy/entry/BudgetEntry.js';
import type { BudgetEntryRepository } from '../../domain/budgy/entry/BudgetEntryRepository.js';
import { getContainer, isNotFound, stripSystemFields } from './client.js';

/** Implementace portů modulu budgy nad Cosmos DB. */

type EntryDocument = EntryData & { userId: string };

export const budgetEntryCosmosRepository: BudgetEntryRepository = {
  async findById(userId, entryId) {
    try {
      const container = await getContainer(CONTAINERS.budgetEntries);
      const { resource } = await container.item(entryId, userId).read<EntryDocument>();
      return resource ? BudgetEntry.fromState(stripSystemFields(resource)) : undefined;
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  },

  async listForUser(userId) {
    const container = await getContainer(CONTAINERS.budgetEntries);
    const { resources } = await container.items
      .query<EntryDocument>({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt ASC',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();

    return resources.map((state) => BudgetEntry.fromState(stripSystemFields(state)));
  },

  async save(entry) {
    const container = await getContainer(CONTAINERS.budgetEntries);
    await container.items.upsert(entry.toDocument());
  },

  async delete(userId, entryId) {
    const container = await getContainer(CONTAINERS.budgetEntries);
    await container.item(entryId, userId).delete();
  },

  async listBySourceRef(refPrefix) {
    const container = await getContainer(CONTAINERS.budgetEntries);
    // Napříč oddíly schválně – viz port. Děje se jen při ukládání platby ve Weddy.
    const { resources } = await container.items
      .query<EntryDocument>({
        query: 'SELECT * FROM c WHERE IS_DEFINED(c.source) AND STARTSWITH(c.source.ref, @prefix)',
        parameters: [{ name: '@prefix', value: refPrefix }],
      })
      .fetchAll();

    return resources.map((state) => BudgetEntry.fromState(stripSystemFields(state)));
  },

  async deleteAllForUser(userId) {
    const container = await getContainer(CONTAINERS.budgetEntries);
    const { resources } = await container.items
      .query<{ id: string }>({
        query: 'SELECT c.id FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();

    await Promise.all(resources.map((row) => container.item(row.id, userId).delete()));
  },
};
