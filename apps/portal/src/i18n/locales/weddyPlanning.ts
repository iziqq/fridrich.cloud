import type { Catalog } from '@fridrich/shared';

/*
 * Jmenný prostor `weddy.planning` (skládá ho weddy.ts) – přehled sekcí a detail sekce.
 * Názvy sekcí a stavů položek jsou ve sdíleném jádru pod `weddyShared.planning`.
 * Plurály: čeština čtyři varianty (nula | jedna | dvě až čtyři | pět a víc), angličtina tři.
 */

export const weddyPlanningCs = {
  overview: {
    lead: '{n} oblastí přípravy. V každé si můžete držet víc variant a rozhodnout se později.',
    empty: 'Zatím prázdné',
    itemCount: '{n} položek | {n} položka | {n} položky | {n} položek',
    acceptedCount: '{n} schváleno',
  },
  category: {
    back: '← Všechny sekce',
    notFound: 'Tahle sekce neexistuje.',
    summaryTotal: 'Celkem {amount}',
    summaryAccepted: 'schváleno {amount}',
    summaryWithoutPrice: '{n} bez ceny',
    emptyTitle: 'Zatím žádné varianty',
    emptyDescription: 'Přidejte možnosti, o kterých uvažujete. Cenu můžete doplnit později.',
    vendorLink: 'Odkaz na dodavatele ↗',
    noLink: 'Bez odkazu',
    noPrice: 'cena zatím není',
    approve: 'Schválit',
    backToDraft: 'Vrátit mezi návrhy',
    addItem: 'Položka',
    newItem: 'Nová položka',
    editItem: 'Upravit položku',
    deleteItem: 'Smazat položku',
    confirmDelete: 'Položka „{name}" zmizí z plánování. Tohle nejde vrátit.',
    form: {
      name: 'Název',
      url: 'Odkaz na dodavatele',
      urlPlaceholder: 'https://…',
      price: 'Cena',
      priceHint: 'V korunách. Nechte prázdné, dokud cenu neznáte.',
      status: 'Stav',
      submit: 'Uložit',
      saving: 'Ukládám…',
      saveFailed: 'Uložení se nepodařilo.',
    },
  },
};

export const weddyPlanningEn: Catalog<typeof weddyPlanningCs> = {
  overview: {
    lead: '{n} areas of preparation. In each one you can keep several options and decide later.',
    empty: 'Empty so far',
    itemCount: '{n} items | {n} item | {n} items',
    acceptedCount: '{n} approved',
  },
  category: {
    back: '← All sections',
    notFound: 'This section does not exist.',
    summaryTotal: 'Total {amount}',
    summaryAccepted: 'approved {amount}',
    summaryWithoutPrice: '{n} without a price',
    emptyTitle: 'No options yet',
    emptyDescription: 'Add the options you are considering. You can fill in the price later.',
    vendorLink: 'Vendor link ↗',
    noLink: 'No link',
    noPrice: 'no price yet',
    approve: 'Approve',
    backToDraft: 'Move back to drafts',
    addItem: 'Item',
    newItem: 'New item',
    editItem: 'Edit item',
    deleteItem: 'Delete item',
    confirmDelete: 'The item "{name}" disappears from the planning. This cannot be undone.',
    form: {
      name: 'Name',
      url: 'Vendor link',
      urlPlaceholder: 'https://…',
      price: 'Price',
      priceHint: 'In Czech crowns. Leave empty until you know the price.',
      status: 'Status',
      submit: 'Save',
      saving: 'Saving…',
      saveFailed: 'Saving failed.',
    },
  },
};
