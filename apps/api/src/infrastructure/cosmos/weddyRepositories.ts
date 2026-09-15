import type { Guest as GuestData, PlanningItem as ItemData } from '@fridrich/weddy-shared';
import { CONTAINERS } from '../../config.js';
import { Guest } from '../../domain/weddy/guests/Guest.js';
import type { GuestRepository } from '../../domain/weddy/guests/GuestRepository.js';
import { PlanningItem } from '../../domain/weddy/planning/PlanningItem.js';
import type { PlanningItemRepository } from '../../domain/weddy/planning/PlanningItemRepository.js';
import { Wedding, type WeddingState } from '../../domain/weddy/wedding/Wedding.js';
import type { WeddingRepository } from '../../domain/weddy/wedding/WeddingRepository.js';
import { getContainer, isNotFound, stripSystemFields } from './client.js';

/** Implementace portů modulu weddy nad Cosmos DB. */

export const weddingCosmosRepository: WeddingRepository = {
  async findById(weddingId) {
    try {
      const container = await getContainer(CONTAINERS.weddings);
      const { resource } = await container.item(weddingId, weddingId).read<WeddingState>();
      return resource ? Wedding.fromState(stripSystemFields(resource)) : undefined;
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  },

  async listForOwner(ownerId) {
    const container = await getContainer(CONTAINERS.weddings);
    const { resources } = await container.items
      .query<WeddingState>({
        query:
          'SELECT * FROM c WHERE ARRAY_CONTAINS(c.ownerIds, @ownerId) ORDER BY c.createdAt DESC',
        parameters: [{ name: '@ownerId', value: ownerId }],
      })
      .fetchAll();

    return resources.map((state) => Wedding.fromState(stripSystemFields(state)));
  },

  async save(wedding) {
    const container = await getContainer(CONTAINERS.weddings);
    await container.items.upsert(wedding.toState());
  },

  async delete(weddingId) {
    const container = await getContainer(CONTAINERS.weddings);
    await container.item(weddingId, weddingId).delete();
  },
};

export const guestCosmosRepository: GuestRepository = {
  async findById(weddingId, guestId) {
    try {
      const container = await getContainer(CONTAINERS.guests);
      const { resource } = await container.item(guestId, weddingId).read<GuestData>();
      return resource ? Guest.fromState(stripSystemFields(resource)) : undefined;
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  },

  async list(weddingId, filter = {}) {
    const container = await getContainer(CONTAINERS.guests);

    const conditions = ['c.weddingId = @weddingId'];
    const parameters: { name: string; value: string }[] = [
      { name: '@weddingId', value: weddingId },
    ];

    for (const field of ['side', 'ageGroup', 'status'] as const) {
      const value = filter[field];
      if (!value) continue;
      conditions.push(`c.${field} = @${field}`);
      parameters.push({ name: `@${field}`, value });
    }

    const { resources } = await container.items
      .query<GuestData>({
        query: `SELECT * FROM c WHERE ${conditions.join(' AND ')} ORDER BY c.lastName ASC`,
        parameters,
      })
      .fetchAll();

    return resources.map((state) => Guest.fromState(stripSystemFields(state)));
  },

  async save(guest) {
    const container = await getContainer(CONTAINERS.guests);
    await container.items.upsert(guest.toState());
  },

  async delete(weddingId, guestId) {
    const container = await getContainer(CONTAINERS.guests);
    await container.item(guestId, weddingId).delete();
  },

  async deleteAllForWedding(weddingId) {
    const container = await getContainer(CONTAINERS.guests);
    const { resources } = await container.items
      .query<{ id: string }>({
        query: 'SELECT c.id FROM c WHERE c.weddingId = @weddingId',
        parameters: [{ name: '@weddingId', value: weddingId }],
      })
      .fetchAll();

    await Promise.all(resources.map((row) => container.item(row.id, weddingId).delete()));
  },
};

export const planningItemCosmosRepository: PlanningItemRepository = {
  async findById(weddingId, itemId) {
    try {
      const container = await getContainer(CONTAINERS.planningItems);
      const { resource } = await container.item(itemId, weddingId).read<ItemData>();
      return resource ? PlanningItem.fromState(stripSystemFields(resource)) : undefined;
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  },

  async list(weddingId, category) {
    const container = await getContainer(CONTAINERS.planningItems);

    const parameters: { name: string; value: string }[] = [
      { name: '@weddingId', value: weddingId },
    ];
    let query = 'SELECT * FROM c WHERE c.weddingId = @weddingId';

    if (category) {
      query += ' AND c.category = @category';
      parameters.push({ name: '@category', value: category });
    }
    query += ' ORDER BY c.createdAt ASC';

    const { resources } = await container.items.query<ItemData>({ query, parameters }).fetchAll();
    return resources.map((state) => PlanningItem.fromState(stripSystemFields(state)));
  },

  async save(item) {
    const container = await getContainer(CONTAINERS.planningItems);
    await container.items.upsert(item.toState());
  },

  async delete(weddingId, itemId) {
    const container = await getContainer(CONTAINERS.planningItems);
    await container.item(itemId, weddingId).delete();
  },

  async deleteAllForWedding(weddingId) {
    const container = await getContainer(CONTAINERS.planningItems);
    const { resources } = await container.items
      .query<{ id: string }>({
        query: 'SELECT c.id FROM c WHERE c.weddingId = @weddingId',
        parameters: [{ name: '@weddingId', value: weddingId }],
      })
      .fetchAll();

    await Promise.all(resources.map((row) => container.item(row.id, weddingId).delete()));
  },
};
