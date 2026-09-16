import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { issuesToDetails } from '@fridrich/shared';
import {
  BudgetEntryInputSchema,
  monthlyTrend,
  overallSummary,
  shiftMonth,
  summarizeMonth,
} from '@fridrich/budgy-shared';
import * as v from 'valibot';
import {
  createEntry,
  deleteEntry,
  eraseUserBudgyData,
  listEntries,
  updateEntry,
} from '../src/application/budgy/entries.js';
import { isDomainError } from '../src/domain/shared/DomainError.js';
import { budgyTestDeps, type BudgyTestContext } from './fakes.js';

const USER = 'user-1';
const STRANGER = 'user-2';

/** Domácnost s výplatou, hypotékou a jedním velkým nákupem v říjnu. */
async function withBudget(): Promise<BudgyTestContext> {
  const deps = budgyTestDeps();

  await createEntry(
    deps,
    { kind: 'income', recurrence: 'monthly', name: 'Výplata', amount: 68000 },
    USER,
  );
  await createEntry(
    deps,
    { kind: 'expense', recurrence: 'monthly', name: 'Hypotéka', amount: 18500, category: 'housing' },
    USER,
  );
  await createEntry(
    deps,
    {
      kind: 'expense',
      recurrence: 'once',
      name: 'Velký nákup',
      amount: 3200,
      category: 'food',
      date: '2026-10-06',
    },
    USER,
  );

  return deps;
}

describe('položky rozpočtu', () => {
  it('pravidelná položka platí od měsíce, ve kterém vznikla', async () => {
    const deps = await withBudget();
    const entries = await listEntries(deps, USER);

    const salary = entries.find((entry) => entry.name === 'Výplata');
    assert.equal(salary?.startsOn, '2026-10');
    assert.equal(summarizeMonth(entries, '2026-09').income, 0, 'zpětně se nedopočítává');
    assert.equal(summarizeMonth(entries, '2026-11').income, 68000, 'dál platí sama');
  });

  it('ukončená položka zůstává v měsících, kdy platila', async () => {
    const deps = await withBudget();
    const before = await listEntries(deps, USER);
    const mortgage = before.find((entry) => entry.name === 'Hypotéka');

    await updateEntry(
      deps,
      mortgage!.id,
      {
        kind: 'expense',
        recurrence: 'monthly',
        name: 'Hypotéka',
        amount: 18500,
        category: 'housing',
        endsOn: '2026-11',
      },
      USER,
    );

    const entries = await listEntries(deps, USER);
    assert.equal(summarizeMonth(entries, '2026-11').expenses, 18500);
    assert.equal(summarizeMonth(entries, '2026-12').expenses, 0);
  });

  it('jednorázová položka se počítá jen ve svém měsíci', async () => {
    const deps = await withBudget();
    const entries = await listEntries(deps, USER);

    assert.equal(summarizeMonth(entries, '2026-10').oneOffExpenses, 3200);
    assert.equal(summarizeMonth(entries, '2026-11').oneOffExpenses, 0);
  });

  it('souhrn měsíce sečte příjmy, výdaje a rozpis podle kategorií', async () => {
    const deps = await withBudget();
    const summary = summarizeMonth(await listEntries(deps, USER), '2026-10');

    assert.equal(summary.income, 68000);
    assert.equal(summary.expenses, 21700);
    assert.equal(summary.remaining, 46300);
    assert.equal(summary.recurringExpenses, 18500);
    assert.deepEqual(
      summary.byCategory.map((row) => row.category),
      ['housing', 'food'],
      'od nejdražší kategorie',
    );
    assert.equal(summary.byCategory[0]?.share.toFixed(3), (18500 / 21700).toFixed(3));
  });

  it('investice snižuje zbytek, ale nepočítá se do výdajů', async () => {
    const deps = await withBudget();
    await createEntry(
      deps,
      { kind: 'investment', recurrence: 'monthly', name: 'ETF', amount: 8000 },
      USER,
    );

    const summary = summarizeMonth(await listEntries(deps, USER), '2026-10');

    assert.equal(summary.investments, 8000);
    assert.equal(summary.expenses, 21700, 'investice není útrata');
    assert.equal(summary.remaining, 68000 - 21700 - 8000);
    assert.deepEqual(
      summary.byCategory.map((row) => row.category),
      ['housing', 'food'],
      'v rozpisu kategorií investice není',
    );
  });

  it('souhrn za celou dobu sčítá měsíc po měsíci, ne položku po položce', async () => {
    const deps = await withBudget();

    // Výplata i hypotéka platí od října; za tři měsíce tedy třikrát.
    const overall = overallSummary(await listEntries(deps, USER), '2026-12');

    assert.equal(overall.firstMonth, '2026-10');
    assert.equal(overall.months, 3);
    assert.equal(overall.income, 68000 * 3);
    assert.equal(overall.expenses, 18500 * 3 + 3200, 'velký nákup jen v říjnu');
    assert.equal(overall.monthlyIncome, 68000);
  });

  it('prázdný rozpočet nemá první měsíc ani průměry', () => {
    const overall = overallSummary([], '2026-10');

    assert.equal(overall.firstMonth, undefined);
    assert.equal(overall.months, 0);
    assert.equal(overall.monthlyExpenses, 0);
  });

  it('cizí položku nelze upravit ani smazat', async () => {
    const deps = await withBudget();
    const entry = (await listEntries(deps, USER))[0];

    await assert.rejects(
      () => deleteEntry(deps, entry!.id, STRANGER),
      (error: unknown) => isDomainError(error) && error.kind === 'notFound',
    );
    assert.equal((await listEntries(deps, STRANGER)).length, 0);
  });

  it('smazání účtu vezme celý rozpočet', async () => {
    const deps = await withBudget();
    await eraseUserBudgyData(deps, { id: USER });

    assert.equal((await listEntries(deps, USER)).length, 0);
  });
});

describe('pravidla položky rozpočtu', () => {
  function fields(input: unknown): string[] {
    const result = v.safeParse(BudgetEntryInputSchema, input);
    return issuesToDetails(result.issues ?? []).map((detail) => detail.field);
  }

  it('výdaj bez kategorie a jednorázová položka bez data hlásí své pole', () => {
    assert.deepEqual(
      fields({ kind: 'expense', recurrence: 'once', name: 'Oběd', amount: 250 }),
      ['category', 'date'],
    );
  });

  it('příjem ani investice kategorii nepotřebují', () => {
    assert.deepEqual(
      fields({ kind: 'income', recurrence: 'monthly', name: 'Výplata', amount: 68000 }),
      [],
    );
    assert.deepEqual(
      fields({ kind: 'investment', recurrence: 'monthly', name: 'ETF', amount: 8000 }),
      [],
    );
  });

  it('konec dřív než začátek neprojde', () => {
    assert.deepEqual(
      fields({
        kind: 'income',
        recurrence: 'monthly',
        name: 'Výplata',
        amount: 100,
        startsOn: '2026-10',
        endsOn: '2026-09',
      }),
      ['endsOn'],
    );
  });
});

describe('výpočty sdílené s frontendem (budgy)', () => {
  it('posun měsíce přechází přes rok', () => {
    assert.equal(shiftMonth('2026-01', -1), '2025-12');
    assert.equal(shiftMonth('2026-12', 2), '2027-02');
  });

  it('vývoj vrací i prázdné měsíce, od nejstaršího', async () => {
    const deps = await withBudget();
    const trend = monthlyTrend(await listEntries(deps, USER), '2026-10', 3);

    assert.deepEqual(
      trend.map((month) => month.month),
      ['2026-08', '2026-09', '2026-10'],
    );
    assert.equal(trend[0]?.expenses, 0);
    assert.equal(trend[2]?.expenses, 21700);
  });
});
