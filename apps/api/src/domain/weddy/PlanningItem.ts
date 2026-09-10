import { isValidHttpUrl } from '@fridrich/shared';
import type {
  PlanningCategory,
  PlanningItem as PlanningItemData,
  PlanningItemStatus,
} from '@fridrich/weddy-shared';
import { isPlanningCategory, isPlanningItemStatus } from '@fridrich/weddy-shared';
import type { Clock } from '../shared/Clock.js';
import { DomainError } from '../shared/DomainError.js';

const NAME_MAX = 200;
const URL_MAX = 2000;
/** Horní mez ceny – chrání před překlepem, který by rozbil rozpočet. */
const PRICE_MAX = 100_000_000;

interface ParsedItem {
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
 * existuje bez ní a rozpočet ji vede zvlášť jako „bez ceny".
 */
export class PlanningItem {
  private constructor(
    readonly id: string,
    readonly weddingId: string,
    private data: ParsedItem,
    readonly createdAt: string,
    private updatedAtValue: string,
  ) {}

  static create(input: {
    id: string;
    weddingId: string;
    raw: unknown;
    clock: Clock;
  }): PlanningItem {
    const parsed = PlanningItem.parse(input.raw);
    const now = input.clock.now().toISOString();
    return new PlanningItem(input.id, input.weddingId, parsed, now, now);
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

  private static parse(raw: unknown): ParsedItem {
    const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
    const details: { field: string; message: string }[] = [];

    const rawName = input['name'];
    let name = '';
    if (typeof rawName !== 'string' || rawName.trim() === '') {
      details.push({ field: 'name', message: 'Vyplňte název' });
    } else {
      name = rawName.trim();
      if (name.length > NAME_MAX) {
        details.push({ field: 'name', message: `Název může mít nejvýše ${NAME_MAX} znaků` });
      }
    }

    if (!isPlanningCategory(input['category'])) {
      details.push({ field: 'category', message: 'Neplatná kategorie' });
    }
    if (input['status'] !== undefined && !isPlanningItemStatus(input['status'])) {
      details.push({ field: 'status', message: 'Neplatný stav položky' });
    }

    let url: string | undefined;
    const rawUrl = input['url'];
    if (typeof rawUrl === 'string' && rawUrl.trim() !== '') {
      url = rawUrl.trim();
      if (url.length > URL_MAX || !isValidHttpUrl(url)) {
        details.push({ field: 'url', message: 'Odkaz musí začínat http:// nebo https://' });
        url = undefined;
      }
    }

    let price: number | undefined;
    const rawPrice = input['price'];
    if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
      const parsedPrice = Number(rawPrice);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > PRICE_MAX) {
        details.push({ field: 'price', message: 'Cena musí být kladné číslo' });
      } else {
        // Haléře nikoho nezajímají a zaokrouhlení drží součty čisté.
        price = Math.round(parsedPrice);
      }
    }

    if (details.length > 0) throw DomainError.validation(details);

    return {
      category: isPlanningCategory(input['category']) ? input['category'] : 'otherActivities',
      name,
      url,
      price,
      status: isPlanningItemStatus(input['status']) ? input['status'] : 'draft',
    };
  }

  get category(): PlanningCategory {
    return this.data.category;
  }

  get updatedAt(): string {
    return this.updatedAtValue;
  }

  update(raw: unknown, clock: Clock): void {
    this.data = PlanningItem.parse(raw);
    this.touch(clock);
  }

  changeStatus(raw: unknown, clock: Clock): void {
    if (!isPlanningItemStatus(raw)) {
      throw DomainError.field('status', 'Neplatný stav položky');
    }
    if (this.data.status === raw) return;

    this.data.status = raw;
    this.touch(clock);
  }

  private touch(clock: Clock): void {
    this.updatedAtValue = clock.now().toISOString();
  }

  toState(): PlanningItemData {
    const state: PlanningItemData = {
      id: this.id,
      weddingId: this.weddingId,
      category: this.data.category,
      name: this.data.name,
      status: this.data.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAtValue,
    };

    if (this.data.url) state.url = this.data.url;
    if (this.data.price !== undefined) state.price = this.data.price;
    return state;
  }
}
