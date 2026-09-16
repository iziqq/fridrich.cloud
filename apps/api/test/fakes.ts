import { LOGIN_CODE_LENGTH } from '@fridrich/shared';
import type { WeddingInput } from '@fridrich/weddy-shared';
import type { IdentityDeps } from '../src/application/identity/deps.js';
import type { BudgyDeps } from '../src/application/budgy/deps.js';
import type { WeddyDeps } from '../src/application/weddy/deps.js';
import type { EmailAddress } from '../src/domain/identity/EmailAddress.js';
import type { EmailMessage, EmailSender } from '../src/domain/shared/EmailSender.js';
import { LoginCode } from '../src/domain/identity/LoginCode.js';
import { OneTimeToken } from '../src/domain/identity/OneTimeToken.js';
import { Session } from '../src/domain/identity/Session.js';
import { User } from '../src/domain/identity/User.js';
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
} from '../src/domain/identity/ports.js';
import { Guest } from '../src/domain/weddy/guests/Guest.js';
import type { GuestFilter, GuestRepository } from '../src/domain/weddy/guests/GuestRepository.js';
import { BudgetEntry } from '../src/domain/budgy/entry/BudgetEntry.js';
import type { BudgetEntryRepository } from '../src/domain/budgy/entry/BudgetEntryRepository.js';
import { PlanningBundle } from '../src/domain/weddy/planning/PlanningBundle.js';
import type { PlanningBundleRepository } from '../src/domain/weddy/planning/PlanningBundleRepository.js';
import { PlanningItem } from '../src/domain/weddy/planning/PlanningItem.js';
import type { PlanningItemRepository } from '../src/domain/weddy/planning/PlanningItemRepository.js';
import { Wedding } from '../src/domain/weddy/wedding/Wedding.js';
import type { WeddingRepository } from '../src/domain/weddy/wedding/WeddingRepository.js';
import { WeddingInvitation } from '../src/domain/weddy/wedding/WeddingInvitation.js';
import type { WeddingInvitationRepository } from '../src/domain/weddy/wedding/WeddingInvitationRepository.js';
import type { DirectoryUser, UserDirectory } from '../src/domain/weddy/wedding/UserDirectory.js';
import { FixedClock } from '../src/domain/shared/Clock.js';
import type { Fingerprint } from '../src/domain/shared/Fingerprint.js';

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

  async listForRetention(inactiveBefore: string, warnedBefore: string, limit: number): Promise<User[]> {
    return [...this.items.values()]
      .filter((state) => (state.lastSeenAt ?? state.createdAt) < inactiveBefore)
      .filter((state) => !state.inactivityWarningSentAt || state.inactivityWarningSentAt <= warnedBefore)
      .slice(0, limit)
      .map((state) => User.fromState(state));
  }

  async save(user: User): Promise<void> {
    this.items.set(user.id, user.toState());
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

export class InMemoryLoginCodeRepository implements LoginCodeRepository {
  readonly items = new Map<string, ReturnType<LoginCode['toState']>>();

  async findForUser(userId: string): Promise<LoginCode | undefined> {
    const found = [...this.items.values()]
      .filter((state) => state.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    return found ? LoginCode.fromState(found) : undefined;
  }

  async save(challenge: LoginCode): Promise<void> {
    this.items.set(challenge.id, challenge.toState());
  }

  async deleteAllForUser(userId: string): Promise<void> {
    for (const [id, state] of this.items) {
      if (state.userId === userId) this.items.delete(id);
    }
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

  async invalidateAll(userId: string): Promise<void> {
    for (const [id, state] of this.items) {
      if (state.userId === userId && !state.usedAt) this.items.delete(id);
    }
  }

  async deleteAllForUser(userId: string): Promise<void> {
    for (const [id, state] of this.items) {
      if (state.userId === userId) this.items.delete(id);
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

export class FakeTokenGenerator implements TokenGenerator {
  private counter = 0;
  private codeCounter = 0;

  generate(): { token: string; tokenHash: string } {
    this.counter += 1;
    const token = `token-${this.counter}`;
    return { token, tokenHash: this.hash(token) };
  }

  /** Předvídatelný kód – test ho tak nemusí lovit z e-mailu přes regulární výraz. */
  generateCode(): string {
    this.codeCounter += 1;
    return String(this.codeCounter).padStart(LOGIN_CODE_LENGTH, '0');
  }

  hash(value: string): string {
    return `hash(${value})`;
  }

  matches(hash: string, value: string): boolean {
    return hash === this.hash(value);
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

/** Zapamatuje si, čí data měl smazat – test ověří, že identity dala produktům vědět. */
export class RecordingUserDataEraser implements UserDataEraser {
  readonly erasedUserIds: string[] = [];

  async eraseUserData(user: { id: string; email: string }): Promise<void> {
    this.erasedUserIds.push(user.id);
  }
}

/** Zapamatuje si nové účty – test ověří, že se produkty o registraci dozvěděly. */
export class RecordingRegistrationListener implements UserRegistrationListener {
  readonly registered: { id: string; email: string }[] = [];

  async onUserRegistered(user: { id: string; email: string }): Promise<void> {
    this.registered.push(user);
  }
}

/* --- Repozitáře modulu weddy --- */

export class InMemoryWeddingRepository implements WeddingRepository {
  readonly items = new Map<string, ReturnType<Wedding['toState']>>();

  async findById(weddingId: string): Promise<Wedding | undefined> {
    const state = this.items.get(weddingId);
    return state ? Wedding.fromState(state) : undefined;
  }

  async listForMember(userId: string): Promise<Wedding[]> {
    return [...this.items.values()]
      .filter((state) => state.memberIds.includes(userId))
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

export class InMemoryBundleRepository implements PlanningBundleRepository {
  readonly items = new Map<string, ReturnType<PlanningBundle['toState']>>();

  async findById(weddingId: string, bundleId: string): Promise<PlanningBundle | undefined> {
    const state = this.items.get(bundleId);
    return state && state.weddingId === weddingId ? PlanningBundle.fromState(state) : undefined;
  }

  async list(weddingId: string): Promise<PlanningBundle[]> {
    return [...this.items.values()]
      .filter((state) => state.weddingId === weddingId)
      .map((state) => PlanningBundle.fromState(state));
  }

  async save(bundle: PlanningBundle): Promise<void> {
    this.items.set(bundle.id, bundle.toState());
  }

  async delete(_weddingId: string, bundleId: string): Promise<void> {
    this.items.delete(bundleId);
  }

  async deleteAllForWedding(weddingId: string): Promise<void> {
    for (const [id, state] of this.items) {
      if (state.weddingId === weddingId) this.items.delete(id);
    }
  }
}

export class InMemoryBudgetEntryRepository implements BudgetEntryRepository {
  readonly items = new Map<string, ReturnType<BudgetEntry['toDocument']>>();

  async findById(userId: string, entryId: string): Promise<BudgetEntry | undefined> {
    const state = this.items.get(entryId);
    return state && state.userId === userId ? BudgetEntry.fromState(state) : undefined;
  }

  async listForUser(userId: string): Promise<BudgetEntry[]> {
    return [...this.items.values()]
      .filter((state) => state.userId === userId)
      .map((state) => BudgetEntry.fromState(state));
  }

  async save(entry: BudgetEntry): Promise<void> {
    this.items.set(entry.id, entry.toDocument());
  }

  async delete(_userId: string, entryId: string): Promise<void> {
    this.items.delete(entryId);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    for (const [id, state] of this.items) {
      if (state.userId === userId) this.items.delete(id);
    }
  }
}

export class InMemoryWeddingInvitationRepository implements WeddingInvitationRepository {
  readonly items = new Map<string, ReturnType<WeddingInvitation['toState']>>();

  async listForWedding(weddingId: string): Promise<WeddingInvitation[]> {
    return [...this.items.values()]
      .filter((state) => state.weddingId === weddingId)
      .map((state) => WeddingInvitation.fromState(state));
  }

  async listForEmailHash(emailHash: string): Promise<WeddingInvitation[]> {
    return [...this.items.values()]
      .filter((state) => state.emailHash === emailHash)
      .map((state) => WeddingInvitation.fromState(state));
  }

  async findById(weddingId: string, invitationId: string): Promise<WeddingInvitation | undefined> {
    const state = this.items.get(invitationId);
    return state && state.weddingId === weddingId ? WeddingInvitation.fromState(state) : undefined;
  }

  async save(invitation: WeddingInvitation): Promise<void> {
    this.items.set(invitation.id, invitation.toState());
  }

  async delete(_weddingId: string, invitationId: string): Promise<void> {
    this.items.delete(invitationId);
  }

  async deleteAllForWedding(weddingId: string): Promise<void> {
    for (const [id, state] of this.items) {
      if (state.weddingId === weddingId) this.items.delete(id);
    }
  }
}

/** Náhrada portu do identity – test si účty naplní sám. */
export class FakeUserDirectory implements UserDirectory {
  readonly users = new Map<string, DirectoryUser>();

  add(user: DirectoryUser): DirectoryUser {
    this.users.set(user.id, user);
    return user;
  }

  async findByEmail(email: string): Promise<DirectoryUser | undefined> {
    return [...this.users.values()].find((user) => user.email === email);
  }

  async findByIds(ids: readonly string[]): Promise<DirectoryUser[]> {
    return ids.map((id) => this.users.get(id)).filter((user) => user !== undefined);
  }
}

/* --- Sestavení závislostí pro testy --- */

export interface IdentityTestContext extends IdentityDeps {
  users: InMemoryUserRepository;
  tokens: InMemoryTokenRepository;
  loginCodes: InMemoryLoginCodeRepository;
  sessions: InMemorySessionRepository;
  tokenGenerator: FakeTokenGenerator;
  email: CollectingEmailSender;
  rateLimiter: CountingRateLimiter;
  clock: FixedClock;
  eraser: RecordingUserDataEraser;
  registrationListener: RecordingRegistrationListener;
}

export function identityTestDeps(): IdentityTestContext {
  const eraser = new RecordingUserDataEraser();
  const registrationListener = new RecordingRegistrationListener();
  return {
    users: new InMemoryUserRepository(),
    tokens: new InMemoryTokenRepository(),
    loginCodes: new InMemoryLoginCodeRepository(),
    sessions: new InMemorySessionRepository(),
    tokenGenerator: new FakeTokenGenerator(),
    ids: new SequentialIds(),
    clock: new FixedClock(new Date('2026-01-01T10:00:00.000Z')),
    email: new CollectingEmailSender(),
    rateLimiter: new CountingRateLimiter(),
    eraser,
    userDataErasers: [eraser],
    registrationListener,
    userRegistrationListeners: [registrationListener],
  };
}

export interface WeddyTestContext extends WeddyDeps {
  weddings: InMemoryWeddingRepository;
  guests: InMemoryGuestRepository;
  items: InMemoryItemRepository;
  bundles: InMemoryBundleRepository;
  invitations: InMemoryWeddingInvitationRepository;
  directory: FakeUserDirectory;
  email: CollectingEmailSender;
  clock: FixedClock;
}

/*
 * Otisk pro testy – čitelný, ale odlišný od vstupu, takže v očekávaných
 * datech pozná, že se ukládá otisk a ne hodnota sama.
 */
export const testFingerprint: Fingerprint = {
  of: (value) => `fp:${value.trim().toLowerCase()}`,
};

export function weddyTestDeps(): WeddyTestContext {
  return {
    weddings: new InMemoryWeddingRepository(),
    guests: new InMemoryGuestRepository(),
    items: new InMemoryItemRepository(),
    bundles: new InMemoryBundleRepository(),
    invitations: new InMemoryWeddingInvitationRepository(),
    directory: new FakeUserDirectory(),
    email: new CollectingEmailSender(),
    fingerprint: testFingerprint,
    appUrl: 'https://www.fridrich.cloud',
    ids: new SequentialIds(),
    clock: new FixedClock(new Date('2026-01-01T10:00:00.000Z')),
  };
}

export const validWedding: WeddingInput = {
  title: 'Svatba Jana & Petra',
  weddingDate: '2026-08-15',
  groom: { firstName: 'Petr', lastName: 'Novák' },
  bride: { firstName: 'Jana', lastName: 'Nováková' },
};

export interface BudgyTestContext extends BudgyDeps {
  entries: InMemoryBudgetEntryRepository;
  clock: FixedClock;
}

/** Závislosti domény budgy pro test – hodiny stojí v říjnu 2026. */
export function budgyTestDeps(): BudgyTestContext {
  return {
    entries: new InMemoryBudgetEntryRepository(),
    ids: new SequentialIds(),
    clock: new FixedClock(new Date('2026-10-15T09:00:00.000Z')),
  };
}
