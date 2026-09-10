import type { Clock } from '../../domain/shared/Clock.js';
import type { IdGenerator } from '../../domain/identity/ports.js';
import type {
  GuestRepository,
  PlanningItemRepository,
  WeddingRepository,
} from '../../domain/weddy/ports.js';

export interface WeddyDeps {
  weddings: WeddingRepository;
  guests: GuestRepository;
  items: PlanningItemRepository;
  ids: IdGenerator;
  clock: Clock;
}
