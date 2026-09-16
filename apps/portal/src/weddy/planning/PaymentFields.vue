<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CheckboxField from '@/components/product/CheckboxField.vue';
import ChoiceField from '@/components/product/ChoiceField.vue';
import FormField from '@/components/product/FormField.vue';
import type { PaymentForm } from './payments';

/**
 * Blok „Platba" ve formuláři položky i balíčku.
 *
 * Záloha se zapíná zaškrtnutím – teprve pak má smysl ptát se na částku a na
 * to, jestli je uhrazená. Stav celé platby stojí zvlášť pod ní: zaplatit se
 * dá i bez zálohy.
 */
defineProps<{ depositError?: string }>();
const form = defineModel<PaymentForm>({ required: true });

const { t } = useI18n();

const stateOptions = computed(() => [
  { value: 'unpaid', label: t('weddy.planning.payment.unpaid') },
  { value: 'paid', label: t('weddy.planning.payment.paid') },
]);
</script>

<template>
  <fieldset class="payment">
    <legend class="mono">{{ t('weddy.planning.payment.title') }}</legend>

    <CheckboxField
      v-model="form.hasDeposit"
      :label="t('weddy.planning.payment.deposit')"
      :hint="t('weddy.planning.payment.depositHint')"
    />

    <div v-if="form.hasDeposit" class="deposit">
      <FormField
        v-model="form.depositAmount"
        :label="t('weddy.planning.payment.depositAmount')"
        numeric
        required
        :error="depositError"
      />
      <ChoiceField
        v-model="form.depositPaid"
        :label="t('weddy.planning.payment.depositState')"
        :options="stateOptions"
      />
    </div>

    <ChoiceField
      v-model="form.paid"
      :label="t('weddy.planning.payment.fullState')"
      :options="stateOptions"
    />

    <!-- Aby propsání do cizího rozpočtu nebylo překvapení. -->
    <p class="ledger-note">{{ t('weddy.planning.payment.ledgerNote') }}</p>
  </fieldset>
</template>

<style scoped>
.payment {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: var(--space-2) 0 0;
  border: 0;
  border-top: 1px solid var(--color-border);
}

legend {
  padding: 0 0.5rem 0 0;
  color: var(--color-muted);
}

.ledger-note {
  margin: 0;
  color: var(--color-muted);
  font-size: var(--text-xs);
}

/* Údaje zálohy odsazené pod zaškrtnutím, ať je vidět, k čemu patří. */
.deposit {
  display: grid;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
  padding-left: var(--space-2);
  border-left: 2px solid var(--color-accent-wash);
}
</style>
