import {
  DEFAULT_LOCALE,
  DisplayNameSchema,
  identityKeys,
  type Locale,
  type User as PublicUser,
} from '@fridrich/shared';
import * as v from 'valibot';
import type { Clock } from '../shared/Clock.js';
import { DomainError } from '../shared/DomainError.js';
import { EmailAddress } from './EmailAddress.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface UserState {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  /** Verze obchodních podmínek, se kterou uživatel při registraci souhlasil. */
  termsVersion?: string;
  termsAcceptedAt?: string;
  /** Poslední přihlášení nebo aktivita v session; podle ní se maže neaktivní účet. */
  lastSeenAt?: string;
  /** Kdy odešlo upozornění, že se neaktivní účet brzy smaže. Aktivita ho ruší. */
  inactivityWarningSentAt?: string;
  /** Jazyk e-mailů, které přijdou bez akce uživatele (plánovač). Chybí u starších účtů = čeština. */
  locale?: Locale;
}

/**
 * Agregát uživatele.
 *
 * Nese chování (ověření e-mailu, přejmenování, aktivitu), ne jen data. Hash hesla sem
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
    readonly termsVersion: string | undefined,
    readonly termsAcceptedAt: string | undefined,
    private lastSeenAtValue: string | undefined,
    private inactivityWarningSentAtValue: string | undefined,
    private localeValue: Locale,
  ) {}

  /**
   * Nový účet vzniká jen se souhlasem s obchodními podmínkami – účet je smlouva
   * o užívání služby a souhlas je její součástí, ne formalita formuláře.
   */
  static register(input: {
    id: string;
    email: EmailAddress;
    displayName: string;
    acceptTerms: boolean;
    termsVersion: string;
    locale: Locale;
    clock: Clock;
  }): User {
    if (!input.acceptTerms) {
      throw DomainError.field('acceptTerms', identityKeys.acceptTermsRequired);
    }

    const displayName = User.normalizeDisplayName(input.displayName);
    const now = input.clock.now().toISOString();

    return new User(
      input.id,
      input.email,
      displayName,
      false,
      now,
      now,
      input.termsVersion,
      now,
      now,
      undefined,
      input.locale,
    );
  }

  static fromState(state: UserState): User {
    return new User(
      state.id,
      EmailAddress.fromStored(state.email),
      state.displayName,
      state.emailVerified,
      state.createdAt,
      state.updatedAt,
      state.termsVersion,
      state.termsAcceptedAt,
      state.lastSeenAt,
      state.inactivityWarningSentAt,
      state.locale ?? DEFAULT_LOCALE,
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

  /** Od kdy se počítá neaktivita – účty z doby před sledováním aktivity berou datum registrace. */
  get lastActivityAt(): string {
    return this.lastSeenAtValue ?? this.createdAt;
  }

  get inactivityWarningSentAt(): string | undefined {
    return this.inactivityWarningSentAtValue;
  }

  get locale(): Locale {
    return this.localeValue;
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

  /**
   * Zaznamená aktivitu uživatele. Vrací `true`, když je potřeba zápis.
   *
   * Zapisuje se nejvýš jednou za den – na lhůtě v řádu měsíců na hodinách
   * nezáleží a každý požadavek by jinak znamenal zápis do databáze. Aktivita
   * zároveň ruší upozornění na blížící se smazání.
   */
  markSeen(clock: Clock): boolean {
    const now = clock.now();
    const seenRecently =
      this.lastSeenAtValue !== undefined &&
      now.getTime() - new Date(this.lastSeenAtValue).getTime() < DAY_MS;

    if (seenRecently && this.inactivityWarningSentAtValue === undefined) return false;

    this.lastSeenAtValue = now.toISOString();
    this.inactivityWarningSentAtValue = undefined;
    return true;
  }

  /** Neaktivní déle, než je daný počet dní. */
  isInactiveFor(days: number, clock: Clock): boolean {
    const inactiveMs = clock.now().getTime() - new Date(this.lastActivityAt).getTime();
    return inactiveMs >= days * DAY_MS;
  }

  /**
   * Smazat jde až po celé lhůtě neaktivity **a** nejdřív `warningDays` po upozornění.
   *
   * Druhá podmínka chrání účty, které upozornění nedostaly včas (plánovač
   * neběžel, účet je z doby před sledováním aktivity) – ty se nejdřív upozorní
   * a smažou se až po plné výpovědní lhůtě, nikdy bez varování.
   */
  isDueForDeletion(retentionDays: number, warningDays: number, clock: Clock): boolean {
    if (!this.isInactiveFor(retentionDays, clock)) return false;
    if (this.inactivityWarningSentAtValue === undefined) return false;

    const sinceWarningMs = clock.now().getTime() - new Date(this.inactivityWarningSentAtValue).getTime();
    return sinceWarningMs >= warningDays * DAY_MS;
  }

  /**
   * Jazyk, ve kterém uživatel web právě používá. Vrací `true`, když je potřeba zápis.
   * Ukládá se kvůli e-mailům z plánovače – ty přijdou, když uživatel web zrovna nemá otevřený.
   */
  changeLocale(locale: Locale): boolean {
    if (this.localeValue === locale) return false;
    this.localeValue = locale;
    return true;
  }

  markInactivityWarningSent(clock: Clock): void {
    this.inactivityWarningSentAtValue = clock.now().toISOString();
  }

  private touch(clock: Clock): void {
    this.updatedAtValue = clock.now().toISOString();
  }

  toState(): UserState {
    const state: UserState = {
      id: this.id,
      email: this.emailAddress.value,
      displayName: this.name,
      emailVerified: this.verified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
      locale: this.localeValue,
    };

    if (this.termsVersion) state.termsVersion = this.termsVersion;
    if (this.termsAcceptedAt) state.termsAcceptedAt = this.termsAcceptedAt;
    if (this.lastSeenAtValue) state.lastSeenAt = this.lastSeenAtValue;
    if (this.inactivityWarningSentAtValue) {
      state.inactivityWarningSentAt = this.inactivityWarningSentAtValue;
    }
    return state;
  }

  /** Tvar, který smí vidět prohlížeč – souhlas a údaje o aktivitě zůstávají na serveru. */
  toPublic(): PublicUser {
    return {
      id: this.id,
      email: this.emailAddress.value,
      displayName: this.name,
      emailVerified: this.verified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };
  }
}
