import type { Catalog } from '@fridrich/shared';

/*
 * Jmenný prostor `weddy.guests` (skládá ho weddy.ts) – obrazovka Hosté.
 * Popisky výčtů (strana, věk, stav) jsou ve sdíleném jádru pod `weddyShared.guests`.
 * Plurály: čeština čtyři varianty (nula | jedna | dvě až čtyři | pět a víc), angličtina tři.
 */

export const weddyGuestsCs = {
  save: 'Uložit',
  saving: 'Ukládám…',
  saveFailed: 'Uložení se nepodařilo.',
  stats: {
    total: 'Celkem',
    accepted: 'Potvrzeno',
    requested: 'Čeká',
    draft: 'Návrhy',
    sides: 'Ženich / Nevěsta',
    ageGroups: 'Dospělí / Děti',
    rejected: 'Odmítlo',
  },
  filters: {
    search: 'Hledat',
    searchPlaceholder: 'Jméno hosta',
    side: 'Strana',
    ageGroup: 'Věk',
    status: 'Stav',
    sort: 'Řadit podle',
    allPeople: 'Všichni',
    allStatuses: 'Všechny',
    clear: 'Zrušit filtry',
  },
  sort: {
    lastName: 'Příjmení',
    firstName: 'Jméno',
  },
  empty: {
    noGuestsTitle: 'Zatím žádní hosté',
    noGuestsDescription: 'Přidejte prvního hosta a začněte skládat seznam.',
    noMatchTitle: 'Nikdo neodpovídá filtru',
    noMatchDescription: 'Zkuste hledání zúžit jinak, nebo filtry zrušte.',
  },
  list: {
    sideEmpty: 'Zatím nikdo',
    changeStatus: 'Změnit stav (nyní {status})',
  },
  guest: {
    add: 'Host',
    new: 'Nový host',
    edit: 'Upravit hosta',
    delete: 'Smazat hosta',
    confirmDelete: 'Opravdu smazat hosta {name}?',
    form: {
      firstName: 'Jméno',
      lastName: 'Příjmení',
      side: 'Strana',
      ageGroup: 'Věková skupina',
      status: 'Stav',
      note: 'Poznámka',
    },
  },
  family: {
    add: '+ Rodina',
    new: 'Nová rodina',
    edit: 'Upravit rodinu',
    delete: 'Smazat rodinu',
    confirmDelete:
      'Opravdu smazat rodinu {name} včetně {n} členů? | Opravdu smazat rodinu {name} včetně {n} člena? | Opravdu smazat rodinu {name} včetně {n} členů? | Opravdu smazat rodinu {name} včetně {n} členů?',
    memberCount: '{n} členů | {n} člen | {n} členové | {n} členů',
    childCount: '{n} dětí | {n} dítě | {n} děti | {n} dětí',
    form: {
      name: 'Název rodiny',
      namePlaceholder: 'Novákovi',
      side: 'Strana',
      members: 'Členové',
      memberFirstName: 'Jméno',
      memberAgeGroup: 'Věk',
      removeMember: 'Odebrat člena',
      addMember: '+ Další člen',
      submit: 'Uložit rodinu',
    },
  },
};

export const weddyGuestsEn: Catalog<typeof weddyGuestsCs> = {
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'Saving failed.',
  stats: {
    total: 'Total',
    accepted: 'Confirmed',
    requested: 'Pending',
    draft: 'Drafts',
    sides: 'Groom / Bride',
    ageGroups: 'Adults / Children',
    rejected: 'Declined',
  },
  filters: {
    search: 'Search',
    searchPlaceholder: 'Guest name',
    side: 'Side',
    ageGroup: 'Age',
    status: 'Status',
    sort: 'Sort by',
    allPeople: 'All',
    allStatuses: 'All',
    clear: 'Clear filters',
  },
  sort: {
    lastName: 'Last name',
    firstName: 'First name',
  },
  empty: {
    noGuestsTitle: 'No guests yet',
    noGuestsDescription: 'Add your first guest and start building the list.',
    noMatchTitle: 'No one matches the filters',
    noMatchDescription: 'Try a different search, or clear the filters.',
  },
  list: {
    sideEmpty: 'No one yet',
    changeStatus: 'Change status (currently {status})',
  },
  guest: {
    add: 'Guest',
    new: 'New guest',
    edit: 'Edit guest',
    delete: 'Delete guest',
    confirmDelete: 'Really delete guest {name}?',
    form: {
      firstName: 'First name',
      lastName: 'Last name',
      side: 'Side',
      ageGroup: 'Age group',
      status: 'Status',
      note: 'Note',
    },
  },
  family: {
    add: '+ Family',
    new: 'New family',
    edit: 'Edit family',
    delete: 'Delete family',
    confirmDelete:
      'Really delete family {name} including {n} members? | Really delete family {name} including {n} member? | Really delete family {name} including {n} members?',
    memberCount: '{n} members | {n} member | {n} members',
    childCount: '{n} children | {n} child | {n} children',
    form: {
      name: 'Family name',
      namePlaceholder: 'The Smiths',
      side: 'Side',
      members: 'Members',
      memberFirstName: 'First name',
      memberAgeGroup: 'Age',
      removeMember: 'Remove member',
      addMember: '+ Add member',
      submit: 'Save family',
    },
  },
};
