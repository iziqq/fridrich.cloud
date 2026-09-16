import {
  canEditWedding,
  canManageWeddingSettings,
  weddingKeys,
  type CoupleInput,
  type InvitableRole,
  type Person,
  type Wedding as WeddingData,
  type WeddingInput,
  type WeddingRole,
  type WeddingSettingsInput,
} from '@fridrich/weddy-shared';
import type { Clock } from '../../shared/Clock.js';
import { DomainError } from '../../shared/DomainError.js';

/** Přístup jednoho uživatele k plánování. */
export interface WeddingMemberState {
  userId: string;
  role: WeddingRole;
  addedAt: string;
}

export interface WeddingState extends WeddingData {
  members: WeddingMemberState[];
  /**
   * Odvozené z `members` – podle něj se v Cosmos DB hledají plánování
   * uživatele. Dotaz na pole objektů by potřeboval poddotaz, tohle stačí
   * `ARRAY_CONTAINS`.
   */
  memberIds: string[];
}

/**
 * Dokument tak, jak může přijít z databáze.
 *
 * Záznamy založené před rolemi mají jen `ownerIds` – `fromState` je převede
 * (první vlastník je admin, další manažeři) a při nejbližším uložení se
 * dokument přepíše do nového tvaru.
 */
export interface StoredWeddingState extends WeddingData {
  members?: WeddingMemberState[];
  memberIds?: string[];
  ownerIds?: string[];
}

/**
 * Agregát plánování svatby – kořen celé domény IziWeddy.
 *
 * Drží název, datum, oba snoubence a **seznam členů s rolemi**. Oprávnění
 * jsou vlastnost svatby, ne něco, co by měl řešit HTTP handler – kontrolu
 * proto volají use-casy všech subdomén přes `assertCanRead/Edit/ManageSettings`.
 * Role popisuje doc/wiki/domains/weddyWedding.md.
 */
export class Wedding {
  private constructor(
    readonly id: string,
    private titleValue: string,
    private weddingDateValue: string | undefined,
    private groomValue: Person,
    private brideValue: Person,
    private memberList: WeddingMemberState[],
    readonly createdAt: string,
    private updatedAtValue: string,
  ) {}

  static create(input: {
    id: string;
    wedding: WeddingInput;
    creatorId: string;
    clock: Clock;
  }): Wedding {
    const now = input.clock.now().toISOString();

    return new Wedding(
      input.id,
      input.wedding.title,
      input.wedding.weddingDate,
      { ...input.wedding.groom },
      { ...input.wedding.bride },
      // Zakladatel je admin – jediná role, která se nedá přidělit ani odebrat.
      [{ userId: input.creatorId, role: 'admin', addedAt: now }],
      now,
      now,
    );
  }

  static fromState(state: StoredWeddingState): Wedding {
    return new Wedding(
      state.id,
      state.title,
      state.weddingDate,
      { ...state.groom },
      { ...state.bride },
      Wedding.membersFrom(state),
      state.createdAt,
      state.updatedAt,
    );
  }

  private static membersFrom(state: StoredWeddingState): WeddingMemberState[] {
    if (state.members && state.members.length > 0) {
      return state.members.map((member) => ({ ...member }));
    }

    return (state.ownerIds ?? []).map((userId, index) => ({
      userId,
      role: index === 0 ? 'admin' : 'manager',
      addedAt: state.createdAt,
    }));
  }

  get title(): string {
    return this.titleValue;
  }

  get weddingDate(): string | undefined {
    return this.weddingDateValue;
  }

  get members(): readonly WeddingMemberState[] {
    return this.memberList;
  }

  get memberIds(): readonly string[] {
    return this.memberList.map((member) => member.userId);
  }

  get updatedAt(): string {
    return this.updatedAtValue;
  }

  /** Role uživatele; `undefined` znamená, že k plánování nemá přístup. */
  roleOf(userId: string): WeddingRole | undefined {
    return this.memberList.find((member) => member.userId === userId)?.role;
  }

  /** Vyhodí `forbidden`, pokud uživatel k plánování vůbec nemá přístup. */
  assertCanRead(userId: string): WeddingRole {
    const role = this.roleOf(userId);
    if (!role) throw DomainError.forbidden(weddingKeys.forbidden);

    return role;
  }

  /** Změna obsahu – snoubenci, hosté, položky plánování. Viewer neprojde. */
  assertCanEdit(userId: string): void {
    if (!canEditWedding(this.assertCanRead(userId))) {
      throw DomainError.forbidden(weddingKeys.editForbidden);
    }
  }

  /** Nastavení, přístupy a smazání plánování – jen admin. */
  assertCanManageSettings(userId: string): void {
    if (!canManageWeddingSettings(this.assertCanRead(userId))) {
      throw DomainError.forbidden(weddingKeys.settingsForbidden);
    }
  }

  /** Snoubenci z obrazovky Snoubenci. */
  updateCouple(couple: CoupleInput, clock: Clock): void {
    this.groomValue = { ...couple.groom };
    this.brideValue = { ...couple.bride };
    this.touch(clock);
  }

  /** Název a datum z Nastavení. */
  updateSettings(settings: WeddingSettingsInput, clock: Clock): void {
    this.titleValue = settings.title;
    this.weddingDateValue = settings.weddingDate;
    this.touch(clock);
  }

  addMember(userId: string, role: InvitableRole, clock: Clock): void {
    if (this.roleOf(userId)) throw DomainError.conflict(weddingKeys.alreadyMember);

    this.memberList.push({ userId, role, addedAt: clock.now().toISOString() });
    this.touch(clock);
  }

  changeMemberRole(userId: string, role: InvitableRole, clock: Clock): void {
    const member = this.requireMember(userId);
    if (member.role === 'admin') throw DomainError.conflict(weddingKeys.adminRoleFixed);
    if (member.role === role) return;

    member.role = role;
    this.touch(clock);
  }

  /** Odebere člena. Admina odebrat nejde – plánování by zůstalo bez správce. */
  removeMember(userId: string, clock: Clock): void {
    const member = this.requireMember(userId);
    if (member.role === 'admin') throw DomainError.conflict(weddingKeys.adminRoleFixed);

    this.memberList = this.memberList.filter((candidate) => candidate.userId !== userId);
    this.touch(clock);
  }

  private requireMember(userId: string): WeddingMemberState {
    const member = this.memberList.find((candidate) => candidate.userId === userId);
    if (!member) throw DomainError.notFound(weddingKeys.memberNotFound);

    return member;
  }

  /** Plánování patří jen tomuto uživateli – po jeho odchodu by nemělo majitele. */
  isOnlyMember(userId: string): boolean {
    return this.memberList.length === 1 && this.memberList[0]?.userId === userId;
  }

  /**
   * Odebere člena při smazání jeho účtu.
   *
   * Když odchází admin a někdo zbývá, převezme roli nejdéle přidaný manager,
   * jinak nejdéle přidaný viewer – jinak by plánování zůstalo bez správce
   * a nikdo by ho nesmazal. Posledního člena odebrat nejde; takové plánování
   * se maže celé (`eraseUserWeddyData`).
   */
  leave(userId: string, clock: Clock): void {
    if (!this.roleOf(userId)) return;
    if (this.memberList.length === 1) {
      throw DomainError.conflict(weddingKeys.lastOwner);
    }

    const leavingAdmin = this.roleOf(userId) === 'admin';
    this.memberList = this.memberList.filter((member) => member.userId !== userId);

    if (leavingAdmin) {
      const successor = [...this.memberList].sort(
        (a, b) =>
          Number(b.role === 'manager') - Number(a.role === 'manager') ||
          a.addedAt.localeCompare(b.addedAt),
      )[0];

      if (successor) successor.role = 'admin';
    }

    this.touch(clock);
  }

  private touch(clock: Clock): void {
    this.updatedAtValue = clock.now().toISOString();
  }

  toState(): WeddingState {
    const state: WeddingState = {
      id: this.id,
      title: this.titleValue,
      groom: { ...this.groomValue },
      bride: { ...this.brideValue },
      members: this.memberList.map((member) => ({ ...member })),
      memberIds: [...this.memberIds],
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };

    if (this.weddingDateValue) state.weddingDate = this.weddingDateValue;
    return state;
  }

  /** Tvar pro frontend – bez seznamu členů; roli doplní use-case podle volajícího. */
  toPublic(): WeddingData {
    const { members: _members, memberIds: _memberIds, ...rest } = this.toState();
    return rest;
  }
}
