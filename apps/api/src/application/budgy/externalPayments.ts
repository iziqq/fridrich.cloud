import type { EntrySourcePart } from '@fridrich/budgy-shared';
import { BudgetEntry } from '../../domain/budgy/entry/BudgetEntry.js';
import type { BudgyDeps } from './deps.js';

/*
 * Platby z jiných aplikací propsané do rozpočtu.
 *
 * Rozpočet sám neví, co je svatba – dostane seznam plateb jedné věci a srovná
 * ho se svými zápisy. Napojení na doménu weddy (její port `PaymentLedger`)
 * je jen v `infrastructure/container.ts` (CLAUDE.md, pravidlo 3).
 */

export interface ExternalPayments {
  app: 'weddy';
  /** Komu se nový zápis připíše. Existující zápis zůstává, kde je. */
  ownerId: string;
  ref: string;
  path: string;
  name: string;
  payments: readonly { part: EntrySourcePart; amount: number }[];
}

/**
 * Srovná zápisy jedné věci s tím, co je teď uhrazené.
 *
 * Hledá se podle odkazu napříč účty: když se mezitím změnil správce
 * plánování, starý zápis je pořád u původního a tam se musí přepsat nebo
 * smazat – jinak by po odškrtnutí „uhrazeno" zůstal viset.
 */
export async function recordExternalPayments(
  deps: BudgyDeps,
  input: ExternalPayments,
): Promise<void> {
  const existing = (await deps.entries.listBySourceRef(input.ref)).filter(
    (entry) => entry.source?.ref === input.ref,
  );

  for (const payment of input.payments) {
    const current = existing.find((entry) => entry.source?.part === payment.part);

    if (current) {
      current.syncManaged(
        { name: input.name, amount: payment.amount, path: input.path },
        deps.clock,
      );
      await deps.entries.save(current);
      continue;
    }

    await deps.entries.save(
      BudgetEntry.createManaged({
        id: deps.ids.next(),
        userId: input.ownerId,
        name: input.name,
        amount: payment.amount,
        category: 'wedding',
        source: { app: input.app, ref: input.ref, part: payment.part, path: input.path },
        clock: deps.clock,
      }),
    );
  }

  // Co už uhrazené není, z rozpočtu zmizí.
  const wanted = new Set(input.payments.map((payment) => payment.part));
  for (const entry of existing) {
    if (entry.source && !wanted.has(entry.source.part)) {
      await deps.entries.delete(entry.userId, entry.id);
    }
  }
}

/**
 * Věc zmizela – zápisy zůstanou jako běžné výdaje, jen se odpojí.
 *
 * `ref` = přesně jedna věc, `refPrefix` = všechno pod ní. Rozlišuje se
 * schválně: odkaz `…:item:i1` je předponou i `…:item:i10`.
 */
export async function releaseExternalPayments(
  deps: BudgyDeps,
  match: { ref: string } | { refPrefix: string },
): Promise<void> {
  const exact = 'ref' in match;
  const entries = await deps.entries.listBySourceRef(exact ? match.ref : match.refPrefix);

  for (const entry of entries) {
    if (exact && entry.source?.ref !== match.ref) continue;

    entry.release(deps.clock);
    await deps.entries.save(entry);
  }
}
