import {
  messageKeys,
  optionalHttpUrl,
  optionalText,
  requiredText,
  type Catalog,
} from '@fridrich/shared';
import * as v from 'valibot';

/*
 * Subdoména `planning` – sekce přípravy a položky od dodavatelů.
 *
 * Položka je jedna varianta v sekci (jedno místo obřadu, o kterém se
 * uvažuje). Cena je nepovinná: dokud dodavatel nepošle nabídku, položka
 * existuje bez ní a rozpočet ji vede zvlášť jako „bez ceny".
 *
 * Balíček je jedna nabídka za jednu cenu, která pokrývá víc položek napříč
 * sekcemi – třeba zámek, kde je v ceně obřad, veselka, jídlo, pití i hudba.
 * Položka v balíčku proto nemá vlastní cenu ani stav: obojí má balíček,
 * protože se přijímá nebo odmítá jako celek. Nemusí mít ani název – uvnitř
 * balíčku říká jen „tahle sekce je v ceně" a jméno jí dává balíček.
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
    music: 'Hudba',
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
  bundleNotFound: 'Balíček neexistuje',
  depositInvalid: 'Záloha musí být kladná částka',
  depositOverPrice: 'Záloha nemůže být vyšší než cena',
};

const en: Catalog<typeof cs> = {
  category: {
    ceremonyVenue: 'Ceremony venue',
    receptionVenue: 'Reception venue',
    food: 'Food',
    drinks: 'Drinks',
    flowers: 'Flowers',
    decorations: 'Decorations',
    music: 'Music',
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
  bundleNotFound: 'The bundle does not exist',
  depositInvalid: 'The deposit must be a positive amount',
  depositOverPrice: 'The deposit cannot be higher than the price',
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
  'music',
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

/* --- Platby --- */

/**
 * Záloha u položky nebo balíčku – kolik a jestli je uhrazená.
 *
 * Jen u věcí s vlastní cenou: položka v balíčku zálohu nemá, platí se
 * balíček (stejně jako u ceny a stavu).
 */
export const DepositSchema = v.object({
  /** V CZK, celé koruny. */
  amount: v.number(),
  paid: v.boolean(),
});
export type Deposit = v.InferOutput<typeof DepositSchema>;

/** Cena z formuláře – koruny, nula až strop, zaokrouhlená. */
function priceInput(min: number, message: string) {
  return v.pipe(
    v.number(message),
    v.finite(message),
    v.minValue(min, message),
    v.maxValue(PRICE_MAX, message),
    v.transform(Math.round),
  );
}

/** Záloha z formuláře. Zaškrtnuté políčko „Záloha" = objekt je, jinak chybí. */
export const DepositInputSchema = v.object({
  amount: priceInput(1, planningKeys.depositInvalid),
  paid: v.optional(v.boolean()),
});

/* --- Položka --- */

export const PlanningItemSchema = v.object({
  id: v.string(),
  weddingId: v.string(),
  category: PlanningCategorySchema,
  /** Samostatná položka ho má vždy; položka v balíčku si bere název balíčku. */
  name: v.optional(v.string()),
  url: v.optional(v.string()),
  /** V CZK, celé koruny. Položka v balíčku ji nemá – cenu nese balíček. */
  price: v.optional(v.number()),
  status: PlanningItemStatusSchema,
  /** Balíček, ve kterém je položka zahrnutá. */
  bundleId: v.optional(v.string()),
  deposit: v.optional(DepositSchema),
  /** Zaplaceno celé. Chybí u dokumentů z doby před platbami – znamená ne. */
  paid: v.optional(v.boolean()),
  createdAt: v.string(),
  updatedAt: v.string(),
});
export type PlanningItem = v.InferOutput<typeof PlanningItemSchema>;

const PRICE_MESSAGE = planningKeys.priceInvalid;

/**
 * Položka z formuláře. Cena se zaokrouhlí na koruny – haléře drží součty nečisté.
 *
 * Název je povinný jen mimo balíček: uvnitř balíčku je položka jenom sekcí,
 * která je v ceně, takže by se název neměl kam vzít. Pravidlo je tady, a ne
 * v doméně, aby chyba dosedla na pole `name` a formulář ji uměl ukázat.
 */
export const PlanningItemInputSchema = v.pipe(
  v.object({
    category: PlanningCategorySchema,
    name: optionalText(NAME_MAX, planningKeys.nameTooLong),
    url: optionalHttpUrl(URL_MAX, planningKeys.urlInvalid),
    price: v.optional(priceInput(0, PRICE_MESSAGE)),
    status: v.optional(PlanningItemStatusSchema),
    bundleId: v.optional(v.string()),
    deposit: v.optional(DepositInputSchema),
    paid: v.optional(v.boolean()),
  }),
  // Záloha nesmí přerůst cenu – chyba sedí na poli částky zálohy.
  v.forward(
    v.check(
      (input) =>
        !input.deposit || input.price === undefined || input.deposit.amount <= input.price,
      planningKeys.depositOverPrice,
    ),
    ['deposit', 'amount'],
  ),
  v.forward(
    v.check(
      (input) => Boolean(input.bundleId) || Boolean(input.name),
      planningKeys.nameRequired,
    ),
    ['name'],
  ),
);
export type PlanningItemInput = v.InferOutput<typeof PlanningItemInputSchema>;

/* --- Balíček --- */

export const PlanningBundleSchema = v.object({
  id: v.string(),
  weddingId: v.string(),
  name: v.string(),
  url: v.optional(v.string()),
  /** V CZK, celé koruny – jedna cena za všechno, co balíček obsahuje. */
  price: v.optional(v.number()),
  status: PlanningItemStatusSchema,
  deposit: v.optional(DepositSchema),
  /** Zaplaceno celé. Chybí u dokumentů z doby před platbami – znamená ne. */
  paid: v.optional(v.boolean()),
  createdAt: v.string(),
  updatedAt: v.string(),
});
export type PlanningBundle = v.InferOutput<typeof PlanningBundleSchema>;

/** Balíček z formuláře. Sekce se nezadávají – vyplynou z položek, které do něj patří. */
export const PlanningBundleInputSchema = v.pipe(
  v.object({
    name: requiredText(planningKeys.nameRequired, NAME_MAX, planningKeys.nameTooLong),
    url: optionalHttpUrl(URL_MAX, planningKeys.urlInvalid),
    price: v.optional(priceInput(0, PRICE_MESSAGE)),
    status: v.optional(PlanningItemStatusSchema),
    deposit: v.optional(DepositInputSchema),
    paid: v.optional(v.boolean()),
  }),
  // Záloha nesmí přerůst cenu – chyba sedí na poli částky zálohy.
  v.forward(
    v.check(
      (input) =>
        !input.deposit || input.price === undefined || input.deposit.amount <= input.price,
      planningKeys.depositOverPrice,
    ),
    ['deposit', 'amount'],
  ),
);
export type PlanningBundleInput = v.InferOutput<typeof PlanningBundleInputSchema>;

/**
 * Stav položky.
 *
 * Položka v balíčku nemá vlastní stav – nabídka se schvaluje jako celek,
 * takže platí stav balíčku. Vlastní stav položky zůstává uložený a vrátí se,
 * až položka balíček opustí.
 */
export function itemStatus(
  item: Pick<PlanningItem, 'status' | 'bundleId'>,
  bundles: readonly PlanningBundle[] = [],
): PlanningItemStatus {
  if (!item.bundleId) return item.status;
  return bundles.find((bundle) => bundle.id === item.bundleId)?.status ?? item.status;
}

/**
 * Název, pod kterým se položka ukazuje.
 *
 * Položka založená uvnitř balíčku žádný svůj nemá – v seznamu sekce pak
 * vystupuje pod jménem nabídky, ze které je.
 */
export function itemTitle(
  item: Pick<PlanningItem, 'name' | 'bundleId'>,
  bundles: readonly PlanningBundle[] = [],
): string {
  if (item.name) return item.name;
  if (!item.bundleId) return '';

  return bundles.find((bundle) => bundle.id === item.bundleId)?.name ?? '';
}

/**
 * Kolik je z ceny už zaplaceno.
 *
 * Zaplaceno celé → celá cena; jinak uhrazená záloha; jinak nic. „Zaplaceno
 * celé" v sobě zálohu zahrnuje – kdo zaplatil všechno, zaplatil i ji – a
 * uložená záloha se kvůli tomu nepřepisuje, aby se po odškrtnutí vrátila.
 * Bez ceny nelze říct, kolik z ní odešlo, takže se nepočítá nic.
 */
export function paidAmount(entry: {
  price?: number;
  paid?: boolean;
  deposit?: Deposit;
}): number {
  if (entry.price === undefined) return entry.deposit?.paid ? entry.deposit.amount : 0;
  if (entry.paid) return entry.price;
  return entry.deposit?.paid ? Math.min(entry.deposit.amount, entry.price) : 0;
}

/**
 * Uhrazené platby jedné věci – tak, jak se mají propsat do rozpočtu.
 *
 * Záloha a doplatek jsou dvě platby: odešly v jiné dny a v rozpočtu mají být
 * dvě. Když je celé zaplaceno bez uhrazené zálohy, je to jedna platba za celou
 * cenu. Celá platba potřebuje cenu (bez ní není co propsat), záloha má vlastní
 * částku. Součet nikdy nepřeroste cenu, takže se nic nezapočte dvakrát.
 */
export function paidParts(entry: {
  price?: number;
  paid?: boolean;
  deposit?: Deposit;
}): { part: 'deposit' | 'rest' | 'full'; amount: number }[] {
  const parts: { part: 'deposit' | 'rest' | 'full'; amount: number }[] = [];

  const depositPaid = entry.deposit?.paid === true && entry.deposit.amount > 0;
  const deposit = depositPaid
    ? Math.min(entry.deposit!.amount, entry.price ?? entry.deposit!.amount)
    : 0;

  if (deposit > 0) parts.push({ part: 'deposit', amount: deposit });

  if (entry.paid && entry.price !== undefined) {
    const rest = entry.price - deposit;
    if (depositPaid && rest > 0) parts.push({ part: 'rest', amount: rest });
    else if (!depositPaid && entry.price > 0) parts.push({ part: 'full', amount: entry.price });
  }

  return parts;
}

/** Sekce, které balíček pokrývá – odvozené ze sekcí jeho položek, v pořadí výčtu. */
export function bundleCategories(
  bundleId: string,
  items: readonly PlanningItem[],
): PlanningCategory[] {
  const covered = new Set(
    items.filter((item) => item.bundleId === bundleId).map((item) => item.category),
  );
  return PLANNING_CATEGORIES.filter((category) => covered.has(category));
}

/**
 * Počet sekcí, ve kterých je aspoň jedna schválená položka.
 *
 * Hrubá míra toho, jak daleko příprava je – dashboard ji ukazuje jako
 * „rozhodnuto 7 z 12". Počítá se z položek, nikde se neukládá.
 */
export function countDecidedSections(
  items: readonly PlanningItem[],
  bundles: readonly PlanningBundle[] = [],
): number {
  const decided = new Set<PlanningCategory>();

  for (const item of items) {
    if (itemStatus(item, bundles) === 'accepted') decided.add(item.category);
  }

  return decided.size;
}
