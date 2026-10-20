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
    final: 'Celkem',
    paste: 'Vložit ze schránky',
    pasting: 'Vkládám…',
  },
  year: {
    label: 'Rok hráče {name}',
    hint: 'Barva čtverečku je pořadí toho dne. Kliknutím se den otevře.',
    rankOf: '{rank}. z {players}',
    points: '{score} b.',
    noPlay: 'nehrálo se',
    missed: 'bez výsledku · hráli {players}',
    legend: 'Co barvy znamenají',
    legendFirst: '1.',
    legendSecond: '2.',
    legendThird: '3.',
    legendRest: '4. a dál',
    legendNone: 'bez výsledku',
  },
  standings: {
    title: 'Pořadí',
    hint: 'Pořadí určuje součet nejlepších her. Bere se jich tolik, kolik tu na hráče v průměru připadá: {count}.',
    // Varianty: nula | jedna | dvě až čtyři | pět a víc (viz czechPlural v i18n/index.ts).
    scoreLabel: 'součet {n} nejlepších | nejlepší hra | součet {n} nejlepších | součet {n} nejlepších',
    games: 'Her',
    wins: 'Výher',
    best: 'Nejlíp',
    average: 'Průměr',
    allLabel: 'součet všeho',
    occasionalNote: 'Hrají míň často – zatím nemají odehráno {games}, takže se do pořadí nepočítají.',
    gameCount: '{n} her | {n} hru | {n} hry | {n} her',
    unranked: 'mimo pořadí',
    emptyTitle: 'Zatím se nehrálo',
    emptyDescription: 'Jakmile někdo vloží první výsledek, objeví se tady pořadí.',
  },
  empty: {
    title: 'Dnes tu ještě nikdo není',
    description:
      'Zahrajte si na maptap.gg, zkopírujte výsledek a ťukněte na tlačítko – zbytek obstarám. Ostatní uvidí, jak jste dopadli.',
  },
  form: {
    title: 'Vložit výsledek',
    clipboardBlocked: 'Do schránky mě prohlížeč nepustil – vložte výsledek sem.',
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
    final: 'Final',
    paste: 'Paste from the clipboard',
    pasting: 'Pasting…',
  },
  year: {
    label: 'The year of {name}',
    hint: 'A square\u2019s colour is the rank that day. Click one to open the day.',
    rankOf: '{rank} of {players}',
    points: '{score} pts',
    noPlay: 'nobody played',
    missed: 'no result · {players} played',
    legend: 'What the colours mean',
    legendFirst: '1st',
    legendSecond: '2nd',
    legendThird: '3rd',
    legendRest: '4th and below',
    legendNone: 'no result',
  },
  standings: {
    title: 'Standings',
    hint: 'The ranking is the sum of a player\u2019s best games. As many of them as the average number of games per player here: {count}.',
    scoreLabel: 'top {n} total | best game | top {n} total',
    games: 'Games',
    wins: 'Wins',
    best: 'Best',
    average: 'Average',
    allLabel: 'all games total',
    occasionalNote: 'They play less often – they have not played {games} yet, so they are left out of the ranking.',
    gameCount: '{n} games | {n} game | {n} games',
    unranked: 'not ranked',
    emptyTitle: 'Nobody has played yet',
    emptyDescription: 'As soon as someone pastes the first result, the standings appear here.',
  },
  empty: {
    title: 'Nobody is here today',
    description:
      'Play a round on maptap.gg, copy the result and tap the button – I will take care of the rest. The others will see how you did.',
  },
  form: {
    title: 'Paste a result',
    clipboardBlocked: 'The browser did not let me read the clipboard – paste the result here.',
    text: 'The result from MapTap',
    placeholder: 'www.maptap.gg October 9\n94:sports_medal: 91:crown: 80:clap:\nFinal score: 660',
    hint: 'Copy the whole text the game offers for sharing, including the first line with the date.',
    preview: 'What I read from it',
    submit: 'Save',
    saving: 'Saving…',
    saveFailed: 'Saving failed.',
  },
};
