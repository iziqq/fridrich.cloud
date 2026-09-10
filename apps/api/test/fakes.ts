import type { IdentityDeps } from '../src/application/identity/deps.js';
import type { WeddyDeps } from '../src/application/weddy/deps.js';
import { Credentials } from '../src/domain/identity/Credentials.js';
import type { EmailAddress } from '../src/domain/identity/EmailAddress.js';
import type { EmailMessage, EmailSender } from '../src/domain/identity/EmailSender.js';
import { OneTimeToken, type TokenPurpose } from '../src/domain/identity/OneTimeToken.js';
import type { Password } from '../src/domain/identity/Password.js';
import type { PasswordHasher } from '../src/domain/identity/PasswordHasher.js';
import { Session } from '../src/domain/identity/Session.js';
import { User } from '../src/domain/identity/User.js';
import type {
  CredentialsRepository,
  IdGenerator,
  RateLimiter,
  SessionRepository,
  TokenGenerator,
  TokenRepository,
  UserRepository,
} from '../src/domain/identity/ports.js';
import { Guest } from '../src/domain/weddy/Guest.js';
import { PlanningItem } from '../src/domain/weddy/PlanningItem.js';
import { Wedding } from '../src/domain/weddy/Wedding.js';
import type {
  GuestFilter,
  GuestRepository,
  PlanningItemRepository,
  WeddingRepository,
} from '../src/domain/weddy/ports.js';
import { FixedClock } from '../src/domain/shared/Clock.js';

/**
 * Paměťové náhrady portů.
 *
 * Testy tak běží bez Cosmos DB a bez mockování SDK – ověřuje se chování
 * domény, ne to, jaké metody se na klientovi zavolaly (CLAUDE.md, Testing).
 */

export class InMemoryUserRepository implements UserRepository {
  readonly items = new Map<string, ReturnType<User['toState']>>();

  async findById(id: string): Promise<User | undefined> {
    const state = this.items.get(id);
    return state ? User.fromState(state) : undefined;
  }

  async findByEmail(email: EmailAddress): Promise<User | undefined> {
    for (const state of this.items.values()) {
      if (state.email === email.value) return User.fromState(state);
    }
    return undefined;
  }

  async save(user: User): Promise<void> {
    this.items.set(user.id, user.toState());
  }
}

export class InMemoryCredentialsRepository implements CredentialsRepository {
  readonly items = new Map<string, ReturnType<Credentials['toState']>>();

  async findByUserId(userId: string): Promise<Credentials | undefined> {
    const state = this.items.get(userId);
    return state ? Credentials.fromState(state) : undefined;
  }

  async save(credentials: Credentials): Promise<void> {
    this.items.set(credentials.userId, credentials.toState());
  }
}

export class InMemoryTokenRepository implements TokenRepository {
  readonly items = new Map<string, ReturnType<OneTimeToken['toState']>>();

  async findByHash(tokenHash: string): Promise<OneTimeToken | undefined> {
    for (const state of this.items.values()) {
      if (state.tokenHash === tokenHash) return OneTimeToken.fromState(state);
    }
    return undefined;
  }

  async save(token: OneTimeToken): Promise<void> {
    this.items.set(token.id, token.toState());
  }

  async invalidateAll(userId: string, purpose: TokenPurpose): Promise<void> {
    for (const [id, state] of this.items) {
      if (state.userId === userId && state.purpose === purpose && !state.usedAt) {
        this.items.delete(id);
      }
    }
  }
}

export class InMemorySessionRepository implements SessionRepository {
  readonly items = new Map<string, ReturnType<Session['toState']>>();

  async findByHash(tokenHash: string): Promise<Session | undefined> {
    for (const state of this.items.values()) {
      if (state.tokenHash === tokenHash) return Session.fromState(state);
    }
    return undefined;
  }

  async save(session: Session): Promise<void> {
    this.items.set(session.id, session.toState());
  }

  async delete(sessionId: string): Promise<void> {
    this.items.delete(sessionId);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    for (const [id, state] of this.items) {
      if (state.userId === userId) this.items.delete(id);
    }
  }
}

/**
 * Rychlá náhrada Argon2id.
 *
 * Skutečný hasher je schválně pomalý; v testech by každé přihlášení stálo
 * desítky milisekund navíc a nic by to neověřilo.
 */
export class FakeHasher implements PasswordHasher {
  weak = false;
  dummyCalls = 0;

  async hash(password: Password): Promise<string> {
    return `${this.weak ? 'v1' : 'v2'}:${password.reveal()}`;
  }

  async verify(encodedHash: string, password: Password): Promise<boolean> {
    return encodedHash.split(':').slice(1).join(':') === password.reveal();
  }

  needsRehash(encodedHash: string): boolean {
    return encodedHash.startsWith('v1:');
  }

  async dummyVerify(): Promise<void> {
    this.dummyCalls += 1;
  }
}

export class FakeTokenGenerator implements TokenGenerator {
  private counter = 0;

  generate(): { token: string; tokenHash: string } {
    this.counter += 1;
    const token = `token-${this.counter}`;
    return { token, tokenHash: this.hash(token) };
  }

  hash(token: string): string {
    return `hash(${token})`;
  }
}

export class SequentialIds implements IdGenerator {
  private counter = 0;

  next(): string {
    this.counter += 1;
    return `id-${this.counter}`;
  }
}

export class CollectingEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }

  get last(): EmailMessage | undefined {
    return this.sent.at(-1);
  }
}

export class CountingRateLimiter implements RateLimiter {
  private counts = new Map<string, number>();
  /** Nastav na true, ať limiter všechno odmítne. */
  blockEverything = false;

  async consume(key: string, limit: number): Promise<boolean> {
    if (this.blockEverything) return false;

    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next <= limit;
  }
}

/* --- Repozitáře modulu weddy --- */

export class InMemoryWeddingRepository implements WeddingRepository {
  readonly items = new Map<string, ReturnType<Wedding['toState']>>();

  async findById(weddingId: string): Promise<Wedding | undefined> {
    const state = this.items.get(weddingId);
    return state ? Wedding.fromState(state) : undefined;
  }

  async listForOwner(ownerId: string): Promise<Wedding[]> {
    return [...this.items.values()]
      .filter((state) => state.ownerIds.includes(ownerId))
      .map((state) => Wedding.fromState(state));
  }

  async save(wedding: Wedding): Promise<void> {
    this.items.set(wedding.id, wedding.toState());
  }

  async delete(weddingId: string): Promise<void> {
    this.items.delete(weddingId);
  }
}

export class InMemoryGuestRepository implements GuestRepository {
  readonly items = new Map<string, ReturnType<Guest['toState']>>();

  async findById(weddingId: string, guestId: string): Promise<Guest | undefined> {
    const state = this.items.get(guestId);
    return state && state.weddingId === weddingId ? Guest.fromState(state) : undefined;
  }

  async list(weddingId: string, filter: GuestFilter = {}): Promise<Guest[]> {
    return [...this.items.values()]
      .filter((state) => {
        if (state.weddingId !== weddingId) return false;
        if (filter.side && state.side !== filter.side) return false;
        if (filter.ageGroup && state.ageGroup !== filter.ageGroup) return false;
        if (filter.status && state.status !== filter.status) return false;
        return true;
      })
      .map((state) => Guest.fromState(state));
  }

  async save(guest: Guest): Promise<void> {
    this.items.set(guest.id, guest.toState());
  }

  async delete(_weddingId: string, guestId: string): Promise<void> {
    this.items.delete(guestId);
  }

  async deleteAllForWedding(weddingId: string): Promise<void> {
    for (const [id, state] of this.items) {
      if (state.weddingId === weddingId) this.items.delete(id);
    }
  }
}

export class InMemoryItemRepository implements PlanningItemRepository {
  readonly items = new Map<string, ReturnType<PlanningItem['toState']>>();

  async findById(weddingId: string, itemId: string): Promise<PlanningItem | undefined> {
    const state = this.items.get(itemId);
    return state && state.weddingId === weddingId ? PlanningItem.fromState(state) : undefined;
  }

  async list(weddingId: string, category?: string): Promise<PlanningItem[]> {
    return [...this.items.values()]
      .filter(
        (state) => state.weddingId === weddingId && (!category || state.category === category),
      )
      .map((state) => PlanningItem.fromState(state));
  }

  async save(item: PlanningItem): Promise<void> {
    this.items.set(item.id, item.toState());
  }

  async delete(_weddingId: string, itemId: string): Promise<void> {
    this.items.delete(itemId);
  }

  async deleteAllForWedding(weddingId: string): Promise<void> {
    for (const [id, state] of this.items) {
      if (state.weddingId === weddingId) this.items.delete(id);
    }
  }
}

/* --- Sestavení závislostí pro testy --- */

export interface IdentityTestContext extends IdentityDeps {
  users: InMemoryUserRepository;
  credentials: InMemoryCredentialsRepository;
  tokens: InMemoryTokenRepository;
  sessions: InMemorySessionRepository;
  hasher: FakeHasher;
  email: CollectingEmailSender;
  rateLimiter: CountingRateLimiter;
  clock: FixedClock;
}

export function identityTestDeps(): IdentityTestContext {
  return {
    users: new InMemoryUserRepository(),
    credentials: new InMemoryCredentialsRepository(),
    tokens: new InMemoryTokenRepository(),
    sessions: new InMemorySessionRepository(),
    hasher: new FakeHasher(),
    tokenGenerator: new FakeTokenGenerator(),
    ids: new SequentialIds(),
    clock: new FixedClock(new Date('2026-01-01T10:00:00.000Z')),
    email: new CollectingEmailSender(),
    rateLimiter: new CountingRateLimiter(),
  };
}

export interface WeddyTestContext extends WeddyDeps {
  weddings: InMemoryWeddingRepository;
  guests: InMemoryGuestRepository;
  items: InMemoryItemRepository;
  clock: FixedClock;
}

export function weddyTestDeps(): WeddyTestContext {
  return {
    weddings: new InMemoryWeddingRepository(),
    guests: new InMemoryGuestRepository(),
    items: new InMemoryItemRepository(),
    ids: new SequentialIds(),
    clock: new FixedClock(new Date('2026-01-01T10:00:00.000Z')),
  };
}

export const validWedding = {
  title: 'Svatba Jana & Petra',
  weddingDate: '2026-08-15',
  groom: { firstName: 'Petr', lastName: 'Novák' },
  bride: { firstName: 'Jana', lastName: 'Nováková' },
};
