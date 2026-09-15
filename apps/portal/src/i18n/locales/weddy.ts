import type { Catalog } from '@fridrich/shared';
import { weddyGuestsCs, weddyGuestsEn } from './weddyGuests';
import { weddyPlanningCs, weddyPlanningEn } from './weddyPlanning';

/*
 * Jmenný prostor `weddy` – obrazovky IziWeddy. Hosté a plánování mají vlastní
 * soubory (velké obrazovky), tady se jen skládají pod `weddy.guests` a `weddy.planning`.
 */

export const weddyCs = {
  guests: weddyGuestsCs,
  planning: weddyPlanningCs,
  components: {
    bottomSheet: { close: 'Zavřít' },
    formField: { optional: 'nepovinné' },
    loadingBlock: { loading: 'Načítám…' },
  },
  notFound: {
    title: 'Stránka nenalezena',
    text: 'Tahle adresa v plánovači neexistuje.',
    back: 'Zpět na přehled',
  },
  dashboard: {
    title: 'Vaše plánování',
    signOut: 'Odhlásit se',
    emptyTitle: 'Zatím tu nic není',
    emptyDescription: 'Založte první plánování a začněte skládat svatbu dohromady.',
    add: 'Přidat plánování',
    noDate: 'Datum zatím není',
    today: 'Dnes je ten den!',
    // Varianty: nula | jedna | dvě až čtyři | pět a víc (viz czechPlural v i18n/index.ts).
    daysLeft: 'Zbývá {n} dní | Zbývá {n} den | Zbývají {n} dny | Zbývá {n} dní',
    daysAgo: 'Před {n} dny | Před {n} dnem | Před {n} dny | Před {n} dny',
    stats: { guests: 'Hosté', budget: 'Rozpočet' },
  },
  weddingNew: {
    back: '← Zpět na přehled',
    title: 'Nové plánování',
    lead: 'Stačí název a jména snoubenců, zbytek se dá doplnit kdykoli později.',
    submit: 'Založit plánování',
  },
  couple: {
    submit: 'Uložit změny',
  },
  weddingForm: {
    wedding: 'Svatba',
    title: 'Název svatby',
    date: 'Datum svatby',
    groom: 'Ženich',
    bride: 'Nevěsta',
    firstName: 'Jméno',
    lastName: 'Příjmení',
    birthYear: 'Rok narození',
    email: 'E-mail',
    phone: 'Telefon',
    note: 'Poznámka',
    saving: 'Ukládám…',
    savedAt: 'Uloženo v {time}',
    saveFailed: 'Uložení se nepodařilo.',
  },
  layout: {
    back: 'Zpět na přehled',
    fallbackTitle: 'Plánování',
    sections: 'Sekce plánování',
    tabs: { couple: 'Snoubenci', guests: 'Hosté', planning: 'Plánování', budget: 'Rozpočet' },
  },
  budget: {
    total: 'Celkem',
    acceptedShare: 'Schváleno {share} z celkové částky',
    accepted: 'Schváleno',
    drafts: 'Návrhy',
    itemsWithoutPrice:
      '{n} položek nemá vyplněnou cenu, takže součet nemusí být úplný. | {n} položka nemá vyplněnou cenu, takže součet nemusí být úplný. | {n} položky nemají vyplněnou cenu, takže součet nemusí být úplný. | {n} položek nemá vyplněnou cenu, takže součet nemusí být úplný.',
    byCategory: 'Rozpis podle sekcí',
    empty: 'Zatím tu není žádná položka s cenou.',
    goToPlanning: 'Přejít na plánování',
    categoryAccepted: 'schváleno {amount}',
    withoutPrice: '{count} bez ceny',
  },
};

export const weddyEn: Catalog<typeof weddyCs> = {
  guests: weddyGuestsEn,
  planning: weddyPlanningEn,
  components: {
    bottomSheet: { close: 'Close' },
    formField: { optional: 'optional' },
    loadingBlock: { loading: 'Loading…' },
  },
  notFound: {
    title: 'Page not found',
    text: 'This address does not exist in the planner.',
    back: 'Back to overview',
  },
  dashboard: {
    title: 'Your wedding plans',
    signOut: 'Sign out',
    emptyTitle: 'Nothing here yet',
    emptyDescription: 'Create your first wedding plan and start putting your wedding together.',
    add: 'Add a wedding plan',
    noDate: 'No date yet',
    today: 'Today is the day!',
    daysLeft: '{n} days left | {n} day left | {n} days left',
    daysAgo: '{n} days ago | {n} day ago | {n} days ago',
    stats: { guests: 'Guests', budget: 'Budget' },
  },
  weddingNew: {
    back: '← Back to overview',
    title: 'New wedding plan',
    lead: 'A title and the names of the couple are enough – you can fill in the rest any time later.',
    submit: 'Create wedding plan',
  },
  couple: {
    submit: 'Save changes',
  },
  weddingForm: {
    wedding: 'Wedding',
    title: 'Wedding title',
    date: 'Wedding date',
    groom: 'Groom',
    bride: 'Bride',
    firstName: 'First name',
    lastName: 'Last name',
    birthYear: 'Year of birth',
    email: 'E-mail',
    phone: 'Phone',
    note: 'Note',
    saving: 'Saving…',
    savedAt: 'Saved at {time}',
    saveFailed: 'Saving failed.',
  },
  layout: {
    back: 'Back to overview',
    fallbackTitle: 'Planning',
    sections: 'Planning sections',
    tabs: { couple: 'Couple', guests: 'Guests', planning: 'Planning', budget: 'Budget' },
  },
  budget: {
    total: 'Total',
    acceptedShare: '{share} of the total approved',
    accepted: 'Approved',
    drafts: 'Drafts',
    itemsWithoutPrice:
      '{n} items have no price, so the total may be incomplete. | {n} item has no price, so the total may be incomplete. | {n} items have no price, so the total may be incomplete.',
    byCategory: 'Breakdown by section',
    empty: 'There are no items with a price yet.',
    goToPlanning: 'Go to planning',
    categoryAccepted: 'approved {amount}',
    withoutPrice: '{count} without price',
  },
};
