import { optionalHttpUrl, requiredText } from '@fridrich/shared';
import * as v from 'valibot';

/*
 * Subdoména `planning` – sekce přípravy a položky od dodavatelů.
 *
 * Položka je jedna varianta v sekci (jedno místo obřadu, o kterém se
 * uvažuje). Cena je nepovinná: dokud dodavatel nepošle nabídku, položka
 * existuje bez ní a rozpočet ji vede zvlášť jako „bez ceny".
 */

const NAME_MAX = 200;
const URL_MAX = 2000;
/** Horní mez ceny – chrání před překlepem, který by rozbil rozpočet. */
const PRICE_MAX = 100_000_000;

/* --- Výčty --- */

/**
 * Pořadí sekcí není abecední, ale tematické: jídlo a pití stojí hned za
 * místem veselky, ke kterému se vážou; prstýnky za obleky a šaty.
 */
export const PLANNING_CATEGORIES = [
  'ceremonyVenue',
  'receptionVenue',
  'food',
  'drinks',
  'flowers',
  'decorations',
  'suit',
  'dress',
  'rings',
  'bachelorParty',
  'otherActivities',
] as const;

export const PLANNING_ITEM_STATUSES = ['draft', 'accepted'] as const;

export const PlanningCategorySchema = v.picklist(PLANNING_CATEGORIES, 'Neplatná kategorie');
export type PlanningCategory = v.InferOutput<typeof PlanningCategorySchema>;

export const PlanningItemStatusSchema = v.picklist(PLANNING_ITEM_STATUSES, 'Neplatný stav položky');
export type PlanningItemStatus = v.InferOutput<typeof PlanningItemStatusSchema>;

export const PLANNING_CATEGORY_LABELS: Record<PlanningCategory, string> = {
  ceremonyVenue: 'Místo obřadu',
  receptionVenue: 'Místo veselky',
  food: 'Jídlo',
  drinks: 'Pití',
  flowers: 'Květiny',
  decorations: 'Výzdoba',
  suit: 'Oblek',
  dress: 'Šaty',
  rings: 'Prstýnky',
  bachelorParty: 'Rozlučka',
  otherActivities: 'Další aktivity',
};

export const PLANNING_ITEM_STATUS_LABELS: Record<PlanningItemStatus, string> = {
  draft: 'Návrh',
  accepted: 'Schváleno',
};

/* --- Položka --- */

export const PlanningItemSchema = v.object({
  id: v.string(),
  weddingId: v.string(),
  category: PlanningCategorySchema,
  name: v.string(),
  url: v.optional(v.string()),
  /** V CZK, celé koruny. */
  price: v.optional(v.number()),
  status: PlanningItemStatusSchema,
  createdAt: v.string(),
  updatedAt: v.string(),
});
export type PlanningItem = v.InferOutput<typeof PlanningItemSchema>;

const PRICE_MESSAGE = 'Cena musí být kladné číslo';

/** Položka z formuláře. Cena se zaokrouhlí na koruny – haléře drží součty nečisté. */
export const PlanningItemInputSchema = v.object({
  category: PlanningCategorySchema,
  name: requiredText('Vyplňte název', NAME_MAX, `Název může mít nejvýše ${NAME_MAX} znaků`),
  url: optionalHttpUrl(URL_MAX, 'Odkaz musí začínat http:// nebo https://'),
  price: v.optional(
    v.pipe(
      v.number(PRICE_MESSAGE),
      v.finite(PRICE_MESSAGE),
      v.minValue(0, PRICE_MESSAGE),
      v.maxValue(PRICE_MAX, PRICE_MESSAGE),
      v.transform(Math.round),
    ),
  ),
  status: v.optional(PlanningItemStatusSchema),
});
export type PlanningItemInput = v.InferOutput<typeof PlanningItemInputSchema>;
