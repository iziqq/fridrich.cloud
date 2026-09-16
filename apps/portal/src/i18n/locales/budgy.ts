import type { Catalog } from '@fridrich/shared';

/*
 * Jmenný prostor `budgy` – obrazovky IziBudgy. Názvy kategorií, druhů položek
 * a hlášky validace jsou ve sdíleném jádru pod `budgyShared.entries`.
 */

export const budgyCs = {
  title: 'Rozpočet',
  notFound: {
    title: 'Stránka nenalezena',
    text: 'Tahle adresa v rozpočtu neexistuje.',
    back: 'Zpět na rozpočet',
  },
  month: {
    previous: 'Předchozí měsíc',
    next: 'Následující měsíc',
    current: 'Zpět na tento měsíc',
  },
  summary: {
    income: 'Příjmy',
    expenses: 'Výdaje',
    remaining: 'Zbývá',
    savedShare: 'Zbývá {share} z příjmů.',
    overspent: 'Měsíc je o {amount} v mínusu.',
  },
  chart: {
    byCategory: 'Kam peníze jdou',
    trend: 'Posledních šest měsíců',
    donutLabel: 'Výdaje měsíce podle kategorií',
    income: 'Příjmy',
    expenses: 'Výdaje',
    noExpenses: 'V tomhle měsíci zatím žádný výdaj není.',
    monthSummary: '{month}: příjmy {income}, výdaje {expenses}',
  },
  sections: {
    income: 'Příjmy',
    incomeEmpty: 'Zatím žádný příjem.',
    incomeAdd: 'Příjem',
    recurring: 'Pravidelné výdaje',
    recurringEmpty: 'Zatím nic pravidelného – hypotéka, pojištění, předplatné.',
    recurringAdd: 'Pravidelný výdaj',
    oneOff: 'Jednorázové výdaje',
    oneOffEmpty: 'V tomhle měsíci jste zatím nic nezadali.',
    oneOffAdd: 'Útratu',
  },
  entry: {
    add: 'Položka',
    edit: 'Upravit položku',
    delete: 'Smazat položku',
    confirmDelete: 'Položka „{name}" z rozpočtu zmizí. Tohle nejde vrátit.',
    until: 'do {month}',
  },
  empty: {
    title: 'Začněme příjmem',
    description:
      'Zadejte, co domácnosti chodí, a pak co z ní odchází. Pravidelné položky se do dalších měsíců přenesou samy.',
  },
  form: {
    newTitle: 'Nová položka',
    editTitle: 'Upravit položku',
    kind: 'Druh',
    recurrence: 'Opakování',
    name: 'Název',
    namePlaceholderIncome: 'Výplata',
    namePlaceholderExpense: 'Hypotéka',
    amount: 'Částka',
    category: 'Kategorie',
    date: 'Datum',
    endsOn: 'Platí do',
    endsOnHint: 'Nechte prázdné, dokud položka chodí každý měsíc.',
    submit: 'Uložit',
    saving: 'Ukládám…',
    saveFailed: 'Uložení se nepodařilo.',
  },
};

export const budgyEn: Catalog<typeof budgyCs> = {
  title: 'Budget',
  notFound: {
    title: 'Page not found',
    text: 'This address does not exist in the budget.',
    back: 'Back to the budget',
  },
  month: {
    previous: 'Previous month',
    next: 'Next month',
    current: 'Back to this month',
  },
  summary: {
    income: 'Income',
    expenses: 'Expenses',
    remaining: 'Remaining',
    savedShare: '{share} of the income is left.',
    overspent: 'The month is {amount} in the red.',
  },
  chart: {
    byCategory: 'Where the money goes',
    trend: 'The last six months',
    donutLabel: 'Expenses of the month by category',
    income: 'Income',
    expenses: 'Expenses',
    noExpenses: 'There is no expense in this month yet.',
    monthSummary: '{month}: income {income}, expenses {expenses}',
  },
  sections: {
    income: 'Income',
    incomeEmpty: 'No income yet.',
    incomeAdd: 'Income',
    recurring: 'Recurring expenses',
    recurringEmpty: 'Nothing recurring yet – mortgage, insurance, subscriptions.',
    recurringAdd: 'Recurring expense',
    oneOff: 'One-off expenses',
    oneOffEmpty: 'You have not entered anything in this month yet.',
    oneOffAdd: 'Expense',
  },
  entry: {
    add: 'Entry',
    edit: 'Edit entry',
    delete: 'Delete entry',
    confirmDelete: 'The entry "{name}" disappears from the budget. This cannot be undone.',
    until: 'until {month}',
  },
  empty: {
    title: 'Let us start with the income',
    description:
      'Enter what comes into the household and then what leaves it. Recurring entries carry over to the next months on their own.',
  },
  form: {
    newTitle: 'New entry',
    editTitle: 'Edit entry',
    kind: 'Kind',
    recurrence: 'Recurrence',
    name: 'Name',
    namePlaceholderIncome: 'Salary',
    namePlaceholderExpense: 'Mortgage',
    amount: 'Amount',
    category: 'Category',
    date: 'Date',
    endsOn: 'Valid until',
    endsOnHint: 'Leave empty while the entry keeps coming every month.',
    submit: 'Save',
    saving: 'Saving…',
    saveFailed: 'Saving failed.',
  },
};
