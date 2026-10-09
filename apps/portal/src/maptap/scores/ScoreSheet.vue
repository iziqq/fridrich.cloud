<script setup lang="ts">
import { parseScoreText, resolvePlayedOn, type ParsedScore } from '@fridrich/maptap-shared';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ApiError } from '@/api/http';
import BottomSheet from '@/components/product/BottomSheet.vue';
import FormField from '@/components/product/FormField.vue';
import { currentLocale, translateMessage } from '@/i18n';
import RoundBadges from './RoundBadges.vue';
import { useBoardStore } from './board.store';

/**
 * Vložení výsledku.
 *
 * Nic se nevyplňuje – hráč sem vysype text, který MapTap nabízí ke sdílení.
 * Náhled pod polem ukazuje, co z něj aplikace přečetla, takže je ještě před
 * uložením vidět, jestli se zkopírovalo všechno.
 */
const open = defineModel<boolean>('open', { required: true });

const store = useBoardStore();
const { t } = useI18n();

const text = ref('');
const errors = ref<Record<string, string>>({});
const saving = ref(false);

watch(open, (isOpen) => {
  if (!isOpen) return;
  text.value = '';
  errors.value = {};
});

/** Co se z vloženého textu podařilo přečíst; `undefined`, dokud nedává smysl. */
const preview = computed<ParsedScore | undefined>(() => {
  if (text.value.trim() === '') return undefined;
  const parsed = parseScoreText(text.value);
  return parsed.ok ? parsed.score : undefined;
});

const previewDay = computed(() => {
  if (!preview.value) return '';
  const played = resolvePlayedOn(preview.value, new Date().toISOString().slice(0, 10));

  return new Intl.DateTimeFormat(currentLocale.value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${played}T00:00:00.000Z`));
});

function errorText(field: string): string | undefined {
  const key = errors.value[field];
  return key ? translateMessage(key) : undefined;
}

async function submit(): Promise<void> {
  errors.value = {};
  saving.value = true;

  try {
    await store.add({ text: text.value });
    open.value = false;
  } catch (cause) {
    errors.value =
      cause instanceof ApiError && cause.details.length > 0
        ? cause.fieldErrors
        : { form: cause instanceof ApiError ? cause.message : 'maptap.form.saveFailed' };
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BottomSheet v-model:open="open" :title="t('maptap.form.title')">
    <form class="sheet-form" novalidate @submit.prevent="submit">
      <FormField
        v-model="text"
        :label="t('maptap.form.text')"
        :placeholder="t('maptap.form.placeholder')"
        textarea
        required
        :hint="t('maptap.form.hint')"
        :error="errorText('text')"
      />

      <!-- Náhled: co z textu přečteme my, aby to hráč viděl dřív než tabule. -->
      <div v-if="preview" class="preview card">
        <p class="mono">{{ t('maptap.form.preview') }}</p>
        <p class="day">{{ previewDay }}</p>
        <RoundBadges :rounds="preview.rounds" />
        <p class="final">
          {{ t('maptap.score.final') }}
          <strong class="score">{{ preview.finalScore }}</strong>
        </p>
      </div>

      <p v-if="errors['form']" class="form-error" role="alert">{{ errorText('form') }}</p>

      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? t('maptap.form.saving') : t('maptap.form.submit') }}
      </button>
    </form>
  </BottomSheet>
</template>

<style scoped>
.sheet-form {
  display: grid;
  gap: var(--space-2);
}

/* Karta zůstává bílá – odznaky kol mají vlastní šedé pozadí a splynuly by s ní. */
.preview {
  display: grid;
  gap: 0.4rem;
}

.preview .mono {
  color: var(--color-muted);
}

.day {
  margin: 0;
  font-weight: 600;
}

.final {
  display: flex;
  gap: 0.4rem;
  align-items: baseline;
  margin: 0;
  color: var(--color-muted);
  font-size: var(--text-sm);
}

.final strong {
  color: var(--color-accent);
  font-size: 1.25rem;
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--text-sm);
}
</style>
