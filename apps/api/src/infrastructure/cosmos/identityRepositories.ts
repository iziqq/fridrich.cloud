import { CONTAINERS } from '../../config.js';
import { Credentials, type CredentialsState } from '../../domain/identity/Credentials.js';
import type { EmailAddress } from '../../domain/identity/EmailAddress.js';
import {
  OneTimeToken,
  type OneTimeTokenState,
  type TokenPurpose,
} from '../../domain/identity/OneTimeToken.js';
import { Session, type SessionState } from '../../domain/identity/Session.js';
import { User, type UserState } from '../../domain/identity/User.js';
import type {
  CredentialsRepository,
  SessionRepository,
  TokenRepository,
  UserRepository,
} from '../../domain/identity/ports.js';
import { getContainer, isNotFound, stripSystemFields } from './client.js';

/**
 * Implementace portů modulu identity nad Cosmos DB.
 *
 * Mapování mezi doménovým objektem a dokumentem (partition key, `id`, TTL)
 * je výhradně tady – doména o Cosmos DB neví (CLAUDE.md, pravidlo 5).
 */

export const userCosmosRepository: UserRepository = {
  async findById(id) {
    try {
      const container = await getContainer(CONTAINERS.users);
      const { resource } = await container.item(id, id).read<UserState>();
      return resource ? User.fromState(stripSystemFields(resource)) : undefined;
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  },

  async findByEmail(email: EmailAddress) {
    const container = await getContainer(CONTAINERS.users);
    const { resources } = await container.items
      .query<UserState>({
        query: 'SELECT * FROM c WHERE c.email = @email OFFSET 0 LIMIT 1',
        parameters: [{ name: '@email', value: email.value }],
      })
      .fetchAll();

    const found = resources[0];
    return found ? User.fromState(stripSystemFields(found)) : undefined;
  },

  async save(user) {
    const container = await getContainer(CONTAINERS.users);
    await container.items.upsert(user.toState());
  },
};

export const credentialsCosmosRepository: CredentialsRepository = {
  async findByUserId(userId) {
    try {
      const container = await getContainer(CONTAINERS.credentials);
      // Dokument má vlastní `id`, aby šel číst přímo bez dotazu.
      const { resource } = await container
        .item(`cred-${userId}`, userId)
        .read<CredentialsState>();
      return resource ? Credentials.fromState(stripSystemFields(resource)) : undefined;
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  },

  async save(credentials) {
    const container = await getContainer(CONTAINERS.credentials);
    const state = credentials.toState();
    await container.items.upsert({ id: `cred-${state.userId}`, ...state });
  },
};

export const tokenCosmosRepository: TokenRepository = {
  async findByHash(tokenHash) {
    const container = await getContainer(CONTAINERS.tokens);
    const { resources } = await container.items
      .query<OneTimeTokenState>({
        query: 'SELECT * FROM c WHERE c.tokenHash = @hash OFFSET 0 LIMIT 1',
        parameters: [{ name: '@hash', value: tokenHash }],
      })
      .fetchAll();

    const found = resources[0];
    return found ? OneTimeToken.fromState(stripSystemFields(found)) : undefined;
  },

  async save(token) {
    const container = await getContainer(CONTAINERS.tokens);
    await container.items.upsert(token.toState());
  },

  async invalidateAll(userId, purpose: TokenPurpose) {
    const container = await getContainer(CONTAINERS.tokens);
    const { resources } = await container.items
      .query<OneTimeTokenState>({
        query:
          'SELECT * FROM c WHERE c.userId = @userId AND c.purpose = @purpose AND NOT IS_DEFINED(c.usedAt)',
        parameters: [
          { name: '@userId', value: userId },
          { name: '@purpose', value: purpose },
        ],
      })
      .fetchAll();

    await Promise.all(
      resources.map((state) => container.item(state.id, userId).delete()),
    );
  },
};

export const sessionCosmosRepository: SessionRepository = {
  async findByHash(tokenHash) {
    const container = await getContainer(CONTAINERS.sessions);
    const { resources } = await container.items
      .query<SessionState>({
        query: 'SELECT * FROM c WHERE c.tokenHash = @hash OFFSET 0 LIMIT 1',
        parameters: [{ name: '@hash', value: tokenHash }],
      })
      .fetchAll();

    const found = resources[0];
    return found ? Session.fromState(stripSystemFields(found)) : undefined;
  },

  async save(session) {
    const container = await getContainer(CONTAINERS.sessions);
    await container.items.upsert(session.toState());
  },

  async delete(sessionId, userId) {
    try {
      const container = await getContainer(CONTAINERS.sessions);
      await container.item(sessionId, userId).delete();
    } catch (error) {
      // Odhlášení už odhlášené session není chyba.
      if (!isNotFound(error)) throw error;
    }
  },

  async deleteAllForUser(userId) {
    const container = await getContainer(CONTAINERS.sessions);
    const { resources } = await container.items
      .query<SessionState>({
        query: 'SELECT c.id FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();

    await Promise.all(resources.map((state) => container.item(state.id, userId).delete()));
  },
};
