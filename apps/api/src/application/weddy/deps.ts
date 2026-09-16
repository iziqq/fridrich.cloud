import type { IdGenerator } from '../../domain/identity/ports.js';
import type { Clock } from '../../domain/shared/Clock.js';
import type { Fingerprint } from '../../domain/shared/Fingerprint.js';
import type { EmailSender } from '../../domain/shared/EmailSender.js';
import type { GuestRepository } from '../../domain/weddy/guests/GuestRepository.js';
import type { PlanningBundleRepository } from '../../domain/weddy/planning/PlanningBundleRepository.js';
import type { PaymentLedger } from '../../domain/weddy/planning/PaymentLedger.js';
import type { PlanningItemRepository } from '../../domain/weddy/planning/PlanningItemRepository.js';
import type { UserDirectory } from '../../domain/weddy/wedding/UserDirectory.js';
import type { WeddingInvitationRepository } from '../../domain/weddy/wedding/WeddingInvitationRepository.js';
import type { WeddingRepository } from '../../domain/weddy/wedding/WeddingRepository.js';

/** Závislosti use-casů domény weddy – předávají se explicitně, ne importem. */
export interface WeddyDeps {
  weddings: WeddingRepository;
  guests: GuestRepository;
  items: PlanningItemRepository;
  /** Balíčky – jedna cena za víc položek napříč sekcemi. */
  bundles: PlanningBundleRepository;
  /** Kam se propisují uhrazené platby – rozpočet správce plánování. */
  ledger: PaymentLedger;
  /** Pozvánky pro adresy, ke kterým zatím nepatří účet. */
  invitations: WeddingInvitationRepository;
  /** Jméno a e-mail k už známému účtu – port do domény identity. */
  directory: UserDirectory;
  email: EmailSender;
  /** Otisky údajů, které se jen porovnávají – e-mail čekající pozvánky. */
  fingerprint: Fingerprint;
  /** Základ odkazů v e-mailech, např. `https://www.fridrich.cloud`. */
  appUrl: string;
  ids: IdGenerator;
  clock: Clock;
}
