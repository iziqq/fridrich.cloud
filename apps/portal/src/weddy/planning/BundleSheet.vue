<script setup lang="ts">
import type { PlanningBundle } from '@fridrich/weddy-shared';
import { planningKeys } from '@fridrich/weddy-shared';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ApiError } from '@/api/http';
import { translateMessage } from '@/i18n';
import BottomSheet from '@/components/product/BottomSheet.vue';
import ChoiceField from '@/components/product/ChoiceField.vue';
import FormField from '@/components/product/FormField.vue';
import { usePlanningStore } from './planning.store';

/**
 * Formulář balíčku – zakládá i upravuje.
 *
 * Sedí ve vlastní komponentě, protože na balíček se dá sáhnout ze dvou míst:
 * z přehledu plánování a z detailu balíčku.
 */
const props = defineProps<{ weddingId: string; bundle: PlanningBundle | null }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ saved: [bundleId: string] }>();

const store = usePlanningStore();
const { t } = useI18n();

const form = reactive({ name: '', url: '', price: '', status: 'draft' });
const errors = ref<Record<string, string>>({});
const saving = ref(false);

function errorText(field: string): string | undefined {
  const key = errors.value[field];
  return key ? translateMessage(key) : undefined;
}

/* Otevření formuláře ho naplní – ať už úpravou, nebo prázdnými poli. */
watch(open, (isOpen) => {
  if (!isOpen) return;

  const bundle = props.bundle;
  Object.assign(form, {
    name: bundle?.name ?? '',
    url: bundle?.url ?? '',
    price: bundle?.price === undefined ? '' : String(bundle.price),
    status: bundle?.status ?? 'draft',
  });
  errors.value = {};
});

const statusOptions = computed(() => [
  { value: 'draft', label: t(planningKeys.status.draft) },
  { value: 'accepted', label: t(planningKeys.status.accepted) },
]);

async function submit(): Promise<void> {
  errors.value = {};
  saving.value = true;

  const input = {
    name: form.name.trim(),
    url: form.url.trim() || undefined,
    price: form.price.trim() === '' ? undefined : Number(form.price),
    status: form.status,
  } as Parameters<typeof store.addBundle>[1];

  try {
    if (props.bundle) {
      await store.editBundle(props.weddingId, props.bundle.id, input);
      emit('saved', props.bundle.id);
    } else {
      const created = await store.addBundle(props.weddingId, input);
      emit('saved', created.id);
    }
    open.value = false;
  } catch (cause) {
    errors.value =
      cause instanceof ApiError && cause.details.length > 0
        ? cause.fieldErrors
        : {
            form:
              cause instanceof ApiError ? cause.message : 'weddy.planning.bundles.form.saveFailed',
          };
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BottomSheet
    v-model:open="open"
    :title="bundle ? t('weddy.planning.bundles.editBundle') : t('weddy.planning.bundles.newBundle')"
  >
    <form class="sheet-form" novalidate @submit.prevent="submit">
      <FormField
        v-model="form.name"
        :label="t('weddy.planning.bundles.form.name')"
        :placeholder="t('weddy.planning.bundles.form.namePlaceholder')"
        required
        :error="errorText('name')"
      />
      <FormField
        v-model="form.url"
        :label="t('weddy.planning.bundles.form.url')"
        type="url"
        placeholder="https://…"
        :error="errorText('url')"
      />
      <FormField
        v-model="form.price"
        :label="t('weddy.planning.bundles.form.price')"
        numeric
        :hint="t('weddy.planning.bundles.form.priceHint')"
        :error="errorText('price')"
      />
      <ChoiceField
        v-model="form.status"
        :label="t('weddy.planning.bundles.form.status')"
        :options="statusOptions"
      />

      <p v-if="errors['form']" class="general-error" role="alert">
        {{ translateMessage(errors['form']) }}
      </p>

      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{
          saving ? t('weddy.planning.bundles.form.saving') : t('weddy.planning.bundles.form.submit')
        }}
      </button>
    </form>
  </BottomSheet>
</template>

<style scoped>
.sheet-form {
  display: grid;
  gap: var(--space-2);
}

.general-error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.875rem;
}
</style>
