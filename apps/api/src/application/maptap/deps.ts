import type { IdGenerator } from '../../domain/identity/ports.js';
import type { MapTapScoreRepository } from '../../domain/maptap/score/MapTapScoreRepository.js';
import type { PlayerDirectory } from '../../domain/maptap/score/PlayerDirectory.js';
import type { Clock } from '../../domain/shared/Clock.js';

/** Závislosti use-casů domény maptap – předávají se explicitně, ne importem. */
export interface MapTapDeps {
  scores: MapTapScoreRepository;
  players: PlayerDirectory;
  ids: IdGenerator;
  clock: Clock;
}
