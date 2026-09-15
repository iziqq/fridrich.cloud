import type {
  PlanningCategory,
  PlanningItem as PlanningItemData,
  PlanningItemInput,
  PlanningItemStatus,
} from '@fridrich/weddy-shared';
import type { Clock } from '../../shared/Clock.js';

interface ItemDetails {
  category: PlanningCategory;
  name: string;
  url: string | undefined;
  price: number | undefined;
  status: PlanningItemStatus;
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
    };
  }

  get category(): PlanningCategory {
    return this.details.category;
  }

  get updatedAt(): string {
    return this.updatedAtValue;
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
      name: this.details.name,
      status: this.details.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };

    if (this.details.url) state.url = this.details.url;
    if (this.details.price !== undefined) state.price = this.details.price;
    return state;
  }
}
