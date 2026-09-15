import { messageKeys, optionalHttpUrl, requiredText, type Catalog } from '@fridrich/shared';
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

const cs = {
  category: {
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
  },
  status: { draft: 'Návrh', accepted: 'Schváleno' },
  categoryInvalid: 'Neplatná kategorie',
  statusInvalid: 'Neplatný stav položky',
  nameRequired: 'Vyplňte název',
  nameTooLong: `Název může mít nejvýše ${NAME_MAX} znaků`,
  urlInvalid: 'Odkaz musí začínat http:// nebo https://',
  priceInvalid: 'Cena musí být kladné číslo',
  itemNotFound: 'Položka neexistuje',
};

const en: Catalog<typeof cs> = {
  category: {
    ceremonyVenue: 'Ceremony venue',
    receptionVenue: 'Reception venue',
    food: 'Food',
    drinks: 'Drinks',
    flowers: 'Flowers',
    decorations: 'Decorations',
    suit: 'Suit',
    dress: 'Dress',
    rings: 'Rings',
    bachelorParty: 'Bachelor party',
    otherActivities: 'Other activities',
  },
  status: { draft: 'Draft', accepted: 'Approved' },
  categoryInvalid: 'Invalid category',
  statusInvalid: 'Invalid item status',
  nameRequired: 'Please enter a name',
  nameTooLong: `The name can have at most ${NAME_MAX} characters`,
  urlInvalid: 'The link must start with http:// or https://',
  priceInvalid: 'The price must be a positive number',
  itemNotFound: 'The item does not exist',
};

/** Hlášky a popisky subdomény `planning` – jmenný prostor `weddyShared.planning`. */
export const planningMessages = { cs, en };
export const planningKeys = messageKeys(cs, 'weddyShared.planning');

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

export const PlanningCategorySchema = v.picklist(PLANNING_CATEGORIES, planningKeys.categoryInvalid);
export type PlanningCategory = v.InferOutput<typeof PlanningCategorySchema>;

export const PlanningItemStatusSchema = v.picklist(PLANNING_ITEM_STATUSES, planningKeys.statusInvalid);
export type PlanningItemStatus = v.InferOutput<typeof PlanningItemStatusSchema>;

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

const PRICE_MESSAGE = planningKeys.priceInvalid;

/** Položka z formuláře. Cena se zaokrouhlí na koruny – haléře drží součty nečisté. */
export const PlanningItemInputSchema = v.object({
  category: PlanningCategorySchema,
  name: requiredText(planningKeys.nameRequired, NAME_MAX, planningKeys.nameTooLong),
  url: optionalHttpUrl(URL_MAX, planningKeys.urlInvalid),
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
