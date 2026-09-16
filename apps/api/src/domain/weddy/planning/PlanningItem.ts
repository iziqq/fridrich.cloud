import type {
  PlanningCategory,
  PlanningItem as PlanningItemData,
  PlanningItemInput,
  PlanningItemStatus,
} from '@fridrich/weddy-shared';
import type { Clock } from '../../shared/Clock.js';

interface ItemDetails {
  category: PlanningCategory;
  /** Položka založená uvnitř balíčku ho nemá – jméno jí dává balíček. */
  name: string | undefined;
  url: string | undefined;
  price: number | undefined;
  status: PlanningItemStatus;
  /** Balíček, který položku zahrnuje – pak platí jeho cena i stav. */
  bundleId: string | undefined;
}

/**
 * Položka plánování – jedna varianta v rámci sekce (např. jedno místo obřadu,
 * o kterém se uvažuje).
 *
 * Cena je nepovinná schválně: dokud dodavatel nepošle nabídku, položka
 * existuje bez ní a rozpočet ji vede zvlášť jako „bez ceny". Vstup je už
 * rozparsovaný schématem `PlanningItemInputSchema`.
 */
export class PlanningItem {
  private constructor(
    readonly id: string,
    readonly weddingId: string,
    private details: ItemDetails,
    readonly createdAt: string,
    private updatedAtValue: string,
  ) {}

  static create(input: {
    id: string;
    weddingId: string;
    item: PlanningItemInput;
    clock: Clock;
  }): PlanningItem {
    const now = input.clock.now().toISOString();
    return new PlanningItem(input.id, input.weddingId, PlanningItem.detailsFrom(input.item), now, now);
  }

  static fromState(state: PlanningItemData): PlanningItem {
    return new PlanningItem(
      state.id,
      state.weddingId,
      {
        category: state.category,
        name: state.name,
        url: state.url,
        price: state.price,
        status: state.status,
        bundleId: state.bundleId,
      },
      state.createdAt,
      state.updatedAt,
    );
  }

  /** Nová položka je návrh – možnost, o které se teprve uvažuje. */
  private static detailsFrom(item: PlanningItemInput): ItemDetails {
    return {
      category: item.category,
      name: item.name,
      url: item.url,
      price: item.price,
      status: item.status ?? 'draft',
      bundleId: item.bundleId,
    };
  }

  get category(): PlanningCategory {
    return this.details.category;
  }

  get updatedAt(): string {
    return this.updatedAtValue;
  }

  get bundleId(): string | undefined {
    return this.details.bundleId;
  }

  /**
   * Vyřadí položku z balíčku – dělá se to při mazání balíčku, aby po něm
   * položky nezmizely. Vrátí se jí vlastní stav, který jí zůstal uložený.
   */
  leaveBundle(clock: Clock): void {
    if (!this.details.bundleId) return;

    this.details.bundleId = undefined;
    this.touch(clock);
  }

  update(item: PlanningItemInput, clock: Clock): void {
    this.details = PlanningItem.detailsFrom(item);
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

  toState(): PlanningItemData {
    const state: PlanningItemData = {
      id: this.id,
      weddingId: this.weddingId,
      category: this.details.category,
      status: this.details.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };

    if (this.details.name) state.name = this.details.name;
    if (this.details.url) state.url = this.details.url;
    if (this.details.price !== undefined) state.price = this.details.price;
    if (this.details.bundleId) state.bundleId = this.details.bundleId;
    return state;
  }
}
