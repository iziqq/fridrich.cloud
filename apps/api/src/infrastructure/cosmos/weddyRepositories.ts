import type { Guest as GuestData, PlanningItem as ItemData } from '@fridrich/weddy-shared';
import { CONTAINERS } from '../../config.js';
import { Guest } from '../../domain/weddy/guests/Guest.js';
import type { GuestRepository } from '../../domain/weddy/guests/GuestRepository.js';
import { PlanningItem } from '../../domain/weddy/planning/PlanningItem.js';
import type { PlanningItemRepository } from '../../domain/weddy/planning/PlanningItemRepository.js';
import { Wedding, type StoredWeddingState } from '../../domain/weddy/wedding/Wedding.js';
import type { WeddingRepository } from '../../domain/weddy/wedding/WeddingRepository.js';
import {
  WeddingInvitation,
  type WeddingInvitationState,
} from '../../domain/weddy/wedding/WeddingInvitation.js';
import type { WeddingInvitationRepository } from '../../domain/weddy/wedding/WeddingInvitationRepository.js';
import { EmailAddress } from '../../domain/identity/EmailAddress.js';
import type { User } from '../../domain/identity/User.js';
import type {
  DirectoryUser,
  UserDirectory,
} from '../../domain/weddy/wedding/UserDirectory.js';
import { getContainer, isNotFound, stripSystemFields } from './client.js';
import { userCosmosRepository } from './identityRepositories.js';

/** Implementace portů modulu weddy nad Cosmos DB. */

export const weddingCosmosRepository: WeddingRepository = {
  async findById(weddingId) {
    try {
      const container = await getContainer(CONTAINERS.weddings);
      const { resource } = await container.item(weddingId, weddingId).read<StoredWeddingState>();
      return resource ? Wedding.fromState(stripSystemFields(resource)) : undefined;
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  },

  async listForMember(userId) {
    const container = await getContainer(CONTAINERS.weddings);
    const { resources } = await container.items
      .query<StoredWeddingState>({
        /*
         * `memberIds` je odvozené pole z `members`; záznamy založené před
         * rolemi mají jen `ownerIds` a dokument se přepíše při prvním uložení,
         * proto se hledá v obou.
         */
        query:
          'SELECT * FROM c WHERE ARRAY_CONTAINS(c.memberIds, @userId) OR ARRAY_CONTAINS(c.ownerIds, @userId) ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: userId }],
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

/**
 * Pozvánky do plánování.
 *
 * Partition key je `/weddingId` – nejčastější čtení je „pozvánky jedné
 * svatby" na obrazovce Nastavení. Hledání podle e-mailu běží přes oddíly,
 * ale děje se jen při registraci účtu a mazání účtu.
 */
export const weddingInvitationCosmosRepository: WeddingInvitationRepository = {
  async listForWedding(weddingId) {
    const container = await getContainer(CONTAINERS.weddingInvitations);
    const { resources } = await container.items
      .query<WeddingInvitationState>({
        query: 'SELECT * FROM c WHERE c.weddingId = @weddingId ORDER BY c.invitedAt ASC',
        parameters: [{ name: '@weddingId', value: weddingId }],
      })
      .fetchAll();

    return resources.map((state) => WeddingInvitation.fromState(stripSystemFields(state)));
  },

  async listForEmail(email) {
    const container = await getContainer(CONTAINERS.weddingInvitations);
    const { resources } = await container.items
      .query<WeddingInvitationState>({
        query: 'SELECT * FROM c WHERE c.email = @email',
        parameters: [{ name: '@email', value: email }],
      })
      .fetchAll();

    return resources.map((state) => WeddingInvitation.fromState(stripSystemFields(state)));
  },

  async findById(weddingId, invitationId) {
    try {
      const container = await getContainer(CONTAINERS.weddingInvitations);
      const { resource } = await container
        .item(invitationId, weddingId)
        .read<WeddingInvitationState>();

      return resource ? WeddingInvitation.fromState(stripSystemFields(resource)) : undefined;
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  },

  async save(invitation) {
    const container = await getContainer(CONTAINERS.weddingInvitations);
    await container.items.upsert(invitation.toState());
  },

  async delete(weddingId, invitationId) {
    try {
      const container = await getContainer(CONTAINERS.weddingInvitations);
      await container.item(invitationId, weddingId).delete();
    } catch (error) {
      // Pozvánku mohlo mezitím smazat TTL – výsledek je stejný.
      if (!isNotFound(error)) throw error;
    }
  },

  async deleteAllForWedding(weddingId) {
    const container = await getContainer(CONTAINERS.weddingInvitations);
    const { resources } = await container.items
      .query<{ id: string }>({
        query: 'SELECT c.id FROM c WHERE c.weddingId = @weddingId',
        parameters: [{ name: '@weddingId', value: weddingId }],
      })
      .fetchAll();

    await Promise.all(resources.map((row) => container.item(row.id, weddingId).delete()));
  },
};

/**
 * Jméno a e-mail k účtu pro obrazovku přístupů.
 *
 * Doména weddy si sáhne přes port `UserDirectory`, ne přímo do repozitáře
 * uživatelů – tady se to potká (CLAUDE.md, pravidlo 3).
 */
export const cosmosUserDirectory: UserDirectory = {
  async findByEmail(email) {
    const user = await userCosmosRepository.findByEmail(EmailAddress.fromStored(email));
    return user ? toDirectoryUser(user) : undefined;
  },

  async findByIds(ids) {
    const users = await Promise.all(ids.map((id) => userCosmosRepository.findById(id)));
    return users.filter((user) => user !== undefined).map((user) => toDirectoryUser(user));
  },
};

function toDirectoryUser(user: User): DirectoryUser {
  return { id: user.id, email: user.email.value, displayName: user.displayName };
}
