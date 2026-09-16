<script setup lang="ts">
import type { Deposit } from '@fridrich/weddy-shared';
import { formatCurrency } from '@fridrich/weddy-shared';
import { useI18n } from 'vue-i18n';
import { currentLocale } from '@/i18n';

/**
 * Stav plateb v kartě položky nebo balíčku – na první pohled, bez otevírání.
 *
 * „Zaplaceno" přebíjí zálohu: kdo zaplatil celé, zálohu už řešit nepotřebuje.
 */
defineProps<{ deposit?: Deposit; paid?: boolean }>();

const { t } = useI18n();

function money(amount: number): string {
  return formatCurrency(amount, currentLocale.value);
}
</script>

<template>
  <span v-if="paid" class="chip paid">✓ {{ t('weddy.planning.payment.fullyPaid') }}</span>
  <span v-else-if="deposit" class="chip" :class="deposit.paid ? 'paid' : 'unpaid'">
    {{
      t(deposit.paid ? 'weddy.planning.payment.depositPaid' : 'weddy.planning.payment.depositUnpaid', {
        amount: money(deposit.amount),
      })
    }}
  </span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.55rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
}

.paid {
  border-color: #bfdcc9;
  background: #eaf5ee;
  color: #386b4c;
}

.unpaid {
  border-color: #f0dcae;
  background: #fdf6e3;
  color: #8a6416;
}
</style>
