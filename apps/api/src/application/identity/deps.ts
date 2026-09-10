import type { Clock } from '../../domain/shared/Clock.js';
import type { PasswordHasher } from '../../domain/identity/PasswordHasher.js';
import type {
  CredentialsRepository,
  IdGenerator,
  RateLimiter,
  SessionRepository,
  TokenGenerator,
  TokenRepository,
  UserRepository,
} from '../../domain/identity/ports.js';
import type { EmailSender } from '../../domain/identity/EmailSender.js';

/** Závislosti use-casů modulu identity – předávají se explicitně, ne importem. */
export interface IdentityDeps {
  users: UserRepository;
  credentials: CredentialsRepository;
  tokens: TokenRepository;
  sessions: SessionRepository;
  hasher: PasswordHasher;
  tokenGenerator: TokenGenerator;
  ids: IdGenerator;
  clock: Clock;
  email: EmailSender;
  rateLimiter: RateLimiter;
}
