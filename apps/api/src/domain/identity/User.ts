import { DisplayNameSchema, type User as PublicUser } from '@fridrich/shared';
import * as v from 'valibot';
import type { Clock } from '../shared/Clock.js';
import { DomainError } from '../shared/DomainError.js';
import { EmailAddress } from './EmailAddress.js';

export interface UserState {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Agregát uživatele.
 *
 * Nese chování (ověření e-mailu, přejmenování), ne jen data. Hash hesla sem
 * schválně nepatří – žije vedle v agregátu `Credentials`, aby se nemohl
 * omylem dostat do odpovědi API spolu s profilem.
 */
export class User {
  private constructor(
    readonly id: string,
    private emailAddress: EmailAddress,
    private name: string,
    private verified: boolean,
    readonly createdAt: string,
    private updatedAtValue: string,
  ) {}

  static register(input: {
    id: string;
    email: EmailAddress;
    displayName: string;
    clock: Clock;
  }): User {
    const displayName = User.normalizeDisplayName(input.displayName);
    const now = input.clock.now().toISOString();

    return new User(input.id, input.email, displayName, false, now, now);
  }

  static fromState(state: UserState): User {
    return new User(
      state.id,
      EmailAddress.fromStored(state.email),
      state.displayName,
      state.emailVerified,
      state.createdAt,
      state.updatedAt,
    );
  }

  /** Jméno je invariant uživatele – drží se ho i volání mimo HTTP (skript, test). */
  private static normalizeDisplayName(raw: string): string {
    const result = v.safeParse(DisplayNameSchema, raw);
    if (!result.success) {
      throw DomainError.field('displayName', result.issues[0].message);
    }

    return result.output;
  }

  get email(): EmailAddress {
    return this.emailAddress;
  }

  get displayName(): string {
    return this.name;
  }

  get emailVerified(): boolean {
    return this.verified;
  }

  get updatedAt(): string {
    return this.updatedAtValue;
  }

  verifyEmail(clock: Clock): void {
    if (this.verified) return; // opakované ověření není chyba, jen nic nedělá
    this.verified = true;
    this.touch(clock);
  }

  rename(displayName: string, clock: Clock): void {
    this.name = User.normalizeDisplayName(displayName);
    this.touch(clock);
  }

  changeEmail(email: EmailAddress, clock: Clock): void {
    if (this.emailAddress.equals(email)) return;
    this.emailAddress = email;
    // Nová adresa se musí ověřit znovu, jinak by šlo účet přesměrovat.
    this.verified = false;
    this.touch(clock);
  }

  private touch(clock: Clock): void {
    this.updatedAtValue = clock.now().toISOString();
  }

  toState(): UserState {
    return {
      id: this.id,
      email: this.emailAddress.value,
      displayName: this.name,
      emailVerified: this.verified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };
  }

  /** Tvar, který smí vidět prohlížeč. */
  toPublic(): PublicUser {
    return this.toState();
  }
}
