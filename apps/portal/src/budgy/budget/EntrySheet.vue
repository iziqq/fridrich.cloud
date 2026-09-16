<script setup lang="ts">
import {
  EXPENSE_CATEGORIES,
  entriesKeys,
  monthOf,
  type BudgetEntry,
  type EntryKind,
} from '@fridrich/budgy-shared';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ApiError } from '@/api/http';
import { translateMessage } from '@/i18n';
import BottomSheet from '@/components/product/BottomSheet.vue';
import ChoiceField from '@/components/product/ChoiceField.vue';
import FormField from '@/components/product/FormField.vue';
import SelectField from '@/components/product/SelectField.vue';
import { useBudgetStore } from './budget.store';

/**
 * Formulář položky rozpočtu – zakládá i upravuje.
 *
 * Formulář se řídí dvěma přepínači: příjem/výdaj rozhoduje o kategorii,
 * pravidelná/jednorázová o datu versus platnosti od–do. Co k dané kombinaci
 * nepatří, se vůbec neukazuje – nemá smysl ptát se na datum útraty
 * u hypotéky, která chodí každý měsíc.
 */
const props = defineProps<{ entry: BudgetEntry | null; defaultKind: EntryKind }>();
const open = defineModel<boolean>('open', { required: true });

const store = useBudgetStore();
const { t } = useI18n();

const form = reactive({
  kind: 'expense' as EntryKind,
  recurrence: 'monthly',
  name: '',
  amount: '',
  category: 'housing',
  date: '',
  endsOn: '',
});

const errors = ref<Record<string, string>>({});
const saving = ref(false);

function errorText(field: string): string | undefined {
  const key = errors.value[field];
  return key ? translateMessage(key) : undefined;
}

/** Den, který formulář nabídne u nové jednorázové položky. */
function defaultDate(): string {
  const today = new Date().toISOString().slice(0, 10);
  // V minulém měsíci by dnešek spadl mimo prohlížený měsíc – pak první den v něm.
  return monthOf(today) === store.month ? today : `${store.month}-01`;
}

watch(open, (isOpen) => {
  if (!isOpen) return;

  const entry = props.entry;
  Object.assign(form, {
    kind: entry?.kind ?? props.defaultKind,
    recurrence: entry?.recurrence ?? (props.defaultKind === 'income' ? 'monthly' : 'once'),
    name: entry?.name ?? '',
    amount: entry ? String(entry.amount) : '',
    category: entry?.category ?? 'housing',
    date: entry?.date ?? defaultDate(),
    endsOn: entry?.endsOn ?? '',
  });
  errors.value = {};
});

const kindOptions = computed(() => [
  { value: 'income', label: t(entriesKeys.kind.income) },
  { value: 'expense', label: t(entriesKeys.kind.expense) },
  { value: 'investment', label: t(entriesKeys.kind.investment) },
]);

const recurrenceOptions = computed(() => [
  { value: 'monthly', label: t(entriesKeys.recurrence.monthly) },
  { value: 'once', label: t(entriesKeys.recurrence.once) },
]);

const categoryOptions = computed(() =>
  EXPENSE_CATEGORIES.map((category) => ({
    value: category,
    label: t(entriesKeys.category[category]),
  })),
);

async function submit(): Promise<void> {
  errors.value = {};
  saving.value = true;

  const once = form.recurrence === 'once';
  const input = {
    kind: form.kind,
    recurrence: form.recurrence,
    name: form.name.trim(),
    amount: form.amount.trim() === '' ? Number.NaN : Number(form.amount),
    category: form.kind === 'expense' ? form.category : undefined,
    date: once ? form.date : undefined,
    endsOn: !once && form.endsOn ? form.endsOn : undefined,
  } as Parameters<typeof store.add>[0];

  try {
    if (props.entry) await store.edit(props.entry.id, input);
    else await store.add(input);
    open.value = false;
  } catch (cause) {
    errors.value =
      cause instanceof ApiError && cause.details.length > 0
        ? cause.fieldErrors
        : { form: cause instanceof ApiError ? cause.message : 'budgy.form.saveFailed' };
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BottomSheet
    v-model:open="open"
    :title="entry ? t('budgy.form.editTitle') : t('budgy.form.newTitle')"
  >
    <form class="sheet-form" novalidate @submit.prevent="submit">
      <ChoiceField v-model="form.kind" :label="t('budgy.form.kind')" :options="kindOptions" />
      <ChoiceField
        v-model="form.recurrence"
        :label="t('budgy.form.recurrence')"
        :options="recurrenceOptions"
      />

      <FormField
        v-model="form.name"
        :label="t('budgy.form.name')"
        :placeholder="t(`budgy.form.namePlaceholder.${form.kind}`)"
        required
        :error="errorText('name')"
      />

      <FormField
        v-model="form.amount"
        :label="t('budgy.form.amount')"
        numeric
        required
        :error="errorText('amount')"
      />

      <SelectField
        v-if="form.kind === 'expense'"
        v-model="form.category"
        :label="t('budgy.form.category')"
        :options="categoryOptions"
      />

      <FormField
        v-if="form.recurrence === 'once'"
        v-model="form.date"
        :label="t('budgy.form.date')"
        type="date"
        required
        :error="errorText('date')"
      />
      <FormField
        v-else
        v-model="form.endsOn"
        :label="t('budgy.form.endsOn')"
        type="month"
        :hint="t('budgy.form.endsOnHint')"
        :error="errorText('endsOn')"
      />

      <p v-if="errors['form']" class="form-error" role="alert">{{ errorText('form') }}</p>

      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? t('budgy.form.saving') : t('budgy.form.submit') }}
      </button>
    </form>
  </BottomSheet>
</template>

<style scoped>
.sheet-form {
  display: grid;
  gap: var(--space-2);
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--text-sm);
}
</style>
