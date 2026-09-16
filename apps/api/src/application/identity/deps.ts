import type { Clock } from '../../domain/shared/Clock.js';
import type {
  IdGenerator,
  LoginCodeRepository,
  RateLimiter,
  SessionRepository,
  TokenGenerator,
  TokenRepository,
  UserDataEraser,
  UserRegistrationListener,
  UserRepository,
} from '../../domain/identity/ports.js';
import type { EmailSender } from '../../domain/shared/EmailSender.js';

/** Závislosti use-casů modulu identity – předávají se explicitně, ne importem. */
export interface IdentityDeps {
  users: UserRepository;
  tokens: TokenRepository;
  loginCodes: LoginCodeRepository;
  sessions: SessionRepository;
  tokenGenerator: TokenGenerator;
  ids: IdGenerator;
  clock: Clock;
  email: EmailSender;
  rateLimiter: RateLimiter;
  /** Mazání dat uživatele v produktech (IziWeddy, …) při smazání účtu. */
  userDataErasers: UserDataEraser[];
  /** Produkty, které chtějí vědět o novém účtu (čekající pozvánky do plánování). */
  userRegistrationListeners: UserRegistrationListener[];
}
