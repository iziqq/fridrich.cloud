import type { Catalog } from '@fridrich/shared';

/*
 * Jmenný prostor `maptap` – obrazovky tabule MapTapu. Hlášky validace
 * vloženého textu a popisky odznaků jsou ve sdíleném jádru pod
 * `maptapShared.scores`.
 */

export const maptapCs = {
  layout: {
    title: 'MapTap',
    back: '← Aplikace',
    tabsLabel: 'Obrazovky tabule',
    tabs: {
      day: 'Den',
      standings: 'Pořadí',
    },
  },
  notFound: {
    title: 'Stránka nenalezena',
    text: 'Tahle adresa v tabuli neexistuje.',
    back: 'Zpět na tabuli',
  },
  day: {
    today: 'Dnes',
    previous: 'Předchozí den',
    next: 'Následující den',
    current: 'Zpět na dnešek',
    rank: '{rank}. místo',
  },
  score: {
    add: 'Výsledek',
    final: 'Celkem',
    delete: 'Smazat výsledek',
    deleteTitle: 'Smazat výsledek?',
    confirmDelete: 'Výsledek z tabule zmizí. Pak ho můžete vložit znovu.',
  },
  standings: {
    title: 'Pořadí',
    hint: 'Řadí průměr, ne součet – kdo hraje déle, tím ještě nevede.',
    average: 'průměr',
    games: 'Her',
    wins: 'Výher',
    best: 'Nejlíp',
    total: 'Celkem',
    emptyTitle: 'Zatím se nehrálo',
    emptyDescription: 'Jakmile někdo vloží první výsledek, objeví se tady pořadí.',
  },
  empty: {
    title: 'Dnes tu ještě nikdo není',
    description:
      'Zahrajte si na maptap.gg, zkopírujte výsledek a vložte ho sem. Ostatní uvidí, jak jste dopadli.',
  },
  form: {
    title: 'Vložit výsledek',
    text: 'Výsledek z MapTapu',
    placeholder: 'www.maptap.gg October 9\n94:sports_medal: 91:crown: 80:clap:\nFinal score: 660',
    hint: 'Zkopírujte celý text, který hra nabízí ke sdílení, včetně prvního řádku s datem.',
    preview: 'Přečetl jsem z toho',
    submit: 'Uložit',
    saving: 'Ukládám…',
    saveFailed: 'Uložení se nepodařilo.',
  },
};

export const maptapEn: Catalog<typeof maptapCs> = {
  layout: {
    title: 'MapTap',
    back: '← Apps',
    tabsLabel: 'Leaderboard screens',
    tabs: {
      day: 'Day',
      standings: 'Standings',
    },
  },
  notFound: {
    title: 'Page not found',
    text: 'This address does not exist in the leaderboard.',
    back: 'Back to the leaderboard',
  },
  day: {
    today: 'Today',
    previous: 'Previous day',
    next: 'Next day',
    current: 'Back to today',
    rank: 'rank {rank}',
  },
  score: {
    add: 'Result',
    final: 'Final',
    delete: 'Delete the result',
    deleteTitle: 'Delete the result?',
    confirmDelete: 'The result disappears from the leaderboard. You can paste it again afterwards.',
  },
  standings: {
    title: 'Standings',
    hint: 'Ranked by average, not by total – playing longer is not the same as playing better.',
    average: 'average',
    games: 'Games',
    wins: 'Wins',
    best: 'Best',
    total: 'Total',
    emptyTitle: 'Nobody has played yet',
    emptyDescription: 'As soon as someone pastes the first result, the standings appear here.',
  },
  empty: {
    title: 'Nobody is here today',
    description:
      'Play a round on maptap.gg, copy the result and paste it here. The others will see how you did.',
  },
  form: {
    title: 'Paste a result',
    text: 'The result from MapTap',
    placeholder: 'www.maptap.gg October 9\n94:sports_medal: 91:crown: 80:clap:\nFinal score: 660',
    hint: 'Copy the whole text the game offers for sharing, including the first line with the date.',
    preview: 'What I read from it',
    submit: 'Save',
    saving: 'Saving…',
    saveFailed: 'Saving failed.',
  },
};
