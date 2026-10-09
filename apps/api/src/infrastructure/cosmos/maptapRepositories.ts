import type { MapTapScore as ScoreData } from '@fridrich/maptap-shared';
import { CONTAINERS } from '../../config.js';
import { MapTapScore } from '../../domain/maptap/score/MapTapScore.js';
import type { MapTapScoreRepository } from '../../domain/maptap/score/MapTapScoreRepository.js';
import type { PlayerDirectory } from '../../domain/maptap/score/PlayerDirectory.js';
import { getContainer, isNotFound, stripSystemFields } from './client.js';
import { userCosmosRepository } from './identityRepositories.js';

/** Implementace portů modulu maptap nad Cosmos DB. */

export const maptapScoreCosmosRepository: MapTapScoreRepository = {
  async findById(userId, scoreId) {
    try {
      const container = await getContainer(CONTAINERS.maptapScores);
      const { resource } = await container.item(scoreId, userId).read<ScoreData>();
      return resource ? MapTapScore.fromState(stripSystemFields(resource)) : undefined;
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  },

  async findForDay(userId, playedOn) {
    const container = await getContainer(CONTAINERS.maptapScores);
    const { resources } = await container.items
      .query<ScoreData>({
        query: 'SELECT * FROM c WHERE c.userId = @userId AND c.playedOn = @playedOn',
        parameters: [
          { name: '@userId', value: userId },
          { name: '@playedOn', value: playedOn },
        ],
      })
      .fetchAll();

    const found = resources[0];
    return found ? MapTapScore.fromState(stripSystemFields(found)) : undefined;
  },

  async listAll() {
    const container = await getContainer(CONTAINERS.maptapScores);
    // Napříč oddíly schválně – tabule je společná, viz port.
    const { resources } = await container.items
      .query<ScoreData>({ query: 'SELECT * FROM c ORDER BY c.playedOn DESC' })
      .fetchAll();

    return resources.map((state) => MapTapScore.fromState(stripSystemFields(state)));
  },

  async save(score) {
    const container = await getContainer(CONTAINERS.maptapScores);
    await container.items.upsert(score.toDocument());
  },

  async delete(userId, scoreId) {
    const container = await getContainer(CONTAINERS.maptapScores);
    await container.item(scoreId, userId).delete();
  },

  async deleteAllForUser(userId) {
    const container = await getContainer(CONTAINERS.maptapScores);
    const { resources } = await container.items
      .query<{ id: string }>({
        query: 'SELECT c.id FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();

    await Promise.all(resources.map((row) => container.item(row.id, userId).delete()));
  },
};

/**
 * Jména hráčů na tabuli.
 *
 * Doména maptap si sáhne přes port `PlayerDirectory`, ne přímo do repozitáře
 * uživatelů – tady se to potká (CLAUDE.md, pravidlo 3).
 */
export const cosmosPlayerDirectory: PlayerDirectory = {
  async findByIds(ids) {
    const users = await Promise.all(ids.map((id) => userCosmosRepository.findById(id)));

    return users
      .filter((user) => user !== undefined)
      .map((user) => ({ id: user.id, displayName: user.displayName }));
  },
};
