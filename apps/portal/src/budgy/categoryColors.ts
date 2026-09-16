import type { ExpenseCategory } from '@fridrich/budgy-shared';

/*
 * Barvy kategorií výdajů.
 *
 * Typ je podle výčtu, ne `Record<string, string>` – na novou kategorii by se
 * tak dala zapomenout barva a v grafu by zůstalo bílé místo. Odstíny jdou od
 * zelené (střecha nad hlavou, nutnost) k teplým (útrata, kterou lze ovlivnit),
 * aby graf říkal něco i bez přečtení legendy.
 */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  housing: '#1f836b',
  insurance: '#33a184',
  connectivity: '#62c0a5',
  subscriptions: '#8ecfb8',
  transport: '#5b8fa8',
  food: '#e0a03f',
  household: '#c98b5e',
  entertainment: '#d2705e',
  health: '#b06a86',
  children: '#8a76b5',
  // Růže z palety IziWeddy – odkud platba přišla, je poznat i bez legendy.
  wedding: '#b4536f',
  other: '#9aa8a4',
};
