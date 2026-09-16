import type {
  Deposit,
  PlanningBundle as PlanningBundleData,
  PlanningBundleInput,
  PlanningItemStatus,
} from '@fridrich/weddy-shared';
import type { Clock } from '../../shared/Clock.js';

interface BundleDetails {
  name: string;
  url: string | undefined;
  price: number | undefined;
  status: PlanningItemStatus;
  deposit: Deposit | undefined;
  paid: boolean;
}

/**
 * Balíček – jedna nabídka za jednu cenu, která pokrývá víc položek najednou
 * (zámek, kde je v ceně obřad, veselka, jídlo, pití i hudba).
 *
 * Balíček nedrží seznam svých položek: naopak položka si drží `bundleId`.
 * Díky tomu je přesun položky mezi balíčky zápis do jednoho dokumentu a
 * seznam se nemůže rozejít se skutečností. Sekce, které balíček pokrývá, se
 * proto vždy odvozují z položek (`bundleCategories` ve sdíleném jádru).
 */
export class PlanningBundle {
  private constructor(
    readonly id: string,
    readonly weddingId: string,
    private details: BundleDetails,
    readonly createdAt: string,
    private updatedAtValue: string,
  ) {}

  static create(input: {
    id: string;
    weddingId: string;
    bundle: PlanningBundleInput;
    clock: Clock;
  }): PlanningBundle {
    const now = input.clock.now().toISOString();
    return new PlanningBundle(
      input.id,
      input.weddingId,
      PlanningBundle.detailsFrom(input.bundle),
      now,
      now,
    );
  }

  static fromState(state: PlanningBundleData): PlanningBundle {
    return new PlanningBundle(
      state.id,
      state.weddingId,
      {
        name: state.name,
        url: state.url,
        price: state.price,
        status: state.status,
        deposit: state.deposit,
        paid: state.paid === true,
      },
      state.createdAt,
      state.updatedAt,
    );
  }

  /** Nový balíček je návrh – nabídka, o které se teprve rozhoduje. */
  private static detailsFrom(bundle: PlanningBundleInput): BundleDetails {
    return {
      name: bundle.name,
      url: bundle.url,
      price: bundle.price,
      status: bundle.status ?? 'draft',
      deposit: bundle.deposit
        ? { amount: bundle.deposit.amount, paid: bundle.deposit.paid ?? false }
        : undefined,
      paid: bundle.paid === true,
    };
  }

  get updatedAt(): string {
    return this.updatedAtValue;
  }

  update(bundle: PlanningBundleInput, clock: Clock): void {
    this.details = PlanningBundle.detailsFrom(bundle);
    this.touch(clock);
  }

  changeStatus(status: PlanningItemStatus, clock: Clock): void {
    if (this.details.status === status) return;

    this.details.status = status;
    this.touch(clock);
  }

  private touch(clock: Clock): void {
    this.updatedAtValue = clock.now().toISOString();
  }

  toState(): PlanningBundleData {
    const state: PlanningBundleData = {
      id: this.id,
      weddingId: this.weddingId,
      name: this.details.name,
      status: this.details.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };

    if (this.details.url) state.url = this.details.url;
    if (this.details.price !== undefined) state.price = this.details.price;
    if (this.details.deposit) state.deposit = this.details.deposit;
    if (this.details.paid) state.paid = true;
    return state;
  }
}
