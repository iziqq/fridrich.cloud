import type { Deposit, PlanningBundle, PlanningItem } from '@fridrich/weddy-shared';

/*
 * Platby ve formuláři položky i balíčku.
 *
 * Formulář drží stav v podobě, která sedí ovládacím prvkům (zaškrtnutí,
 * text v poli částky, přepínače), a teprve při uložení se převede na tvar
 * schématu. Obě obrazovky tak sdílejí jediný převod tam i zpátky.
 */
export interface PaymentForm {
  hasDeposit: boolean;
  depositAmount: string;
  depositPaid: 'unpaid' | 'paid';
  paid: 'unpaid' | 'paid';
}

export function emptyPaymentForm(): PaymentForm {
  return { hasDeposit: false, depositAmount: '', depositPaid: 'unpaid', paid: 'unpaid' };
}

export function paymentFormFrom(entry: Pick<PlanningItem | PlanningBundle, 'deposit' | 'paid'>): PaymentForm {
  return {
    hasDeposit: Boolean(entry.deposit),
    depositAmount: entry.deposit ? String(entry.deposit.amount) : '',
    depositPaid: entry.deposit?.paid ? 'paid' : 'unpaid',
    paid: entry.paid ? 'paid' : 'unpaid',
  };
}

/** Tvar pro API. Prázdná částka u zaškrtnuté zálohy se pošle jako NaN – schéma ji odmítne na správném poli. */
export function paymentInput(form: PaymentForm): { deposit?: { amount: number; paid: boolean }; paid: boolean } {
  const deposit: Deposit | undefined = form.hasDeposit
    ? {
        amount: form.depositAmount.trim() === '' ? Number.NaN : Number(form.depositAmount),
        paid: form.depositPaid === 'paid',
      }
    : undefined;

  return { ...(deposit ? { deposit } : {}), paid: form.paid === 'paid' };
}
