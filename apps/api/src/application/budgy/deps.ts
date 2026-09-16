import type { IdGenerator } from '../../domain/identity/ports.js';
import type { BudgetEntryRepository } from '../../domain/budgy/entry/BudgetEntryRepository.js';
import type { Clock } from '../../domain/shared/Clock.js';

/** Závislosti use-casů domény budgy – předávají se explicitně, ne importem. */
export interface BudgyDeps {
  entries: BudgetEntryRepository;
  ids: IdGenerator;
  clock: Clock;
}
