import type { IdGenerator } from '../../domain/identity/ports.js';
import type { Clock } from '../../domain/shared/Clock.js';
import type { GuestRepository } from '../../domain/weddy/guests/GuestRepository.js';
import type { PlanningItemRepository } from '../../domain/weddy/planning/PlanningItemRepository.js';
import type { WeddingRepository } from '../../domain/weddy/wedding/WeddingRepository.js';

/** Závislosti use-casů domény weddy – předávají se explicitně, ne importem. */
export interface WeddyDeps {
  weddings: WeddingRepository;
  guests: GuestRepository;
  items: PlanningItemRepository;
  ids: IdGenerator;
  clock: Clock;
}
