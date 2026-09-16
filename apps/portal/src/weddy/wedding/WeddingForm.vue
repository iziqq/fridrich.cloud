<script setup lang="ts">
import type { WeddingDetail, WeddingInput } from '@fridrich/weddy-shared';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ApiError } from '@/api/http';
import { currentLocale, translateMessage } from '@/i18n';
import FormField from '@/weddy/components/FormField.vue';

const props = withDefaults(
  defineProps<{
    wedding?: WeddingDetail | null;
    submitLabel: string;
    /**
     * Zakládání sbírá i název a datum; na obrazovce Snoubenci patří do
     * Nastavení, takže se nezobrazují.
     */
    withSettings?: boolean;
    /** Role viewer – formulář se ukáže vyplněný, ale zamčený. */
    readonly?: boolean;
    /** Vytvoření i úprava sdílí formulář, liší se jen tímhle voláním. */
    save: (input: WeddingInput) => Promise<WeddingDetail>;
  }>(),
  { withSettings: false, readonly: false },
);

const emit = defineEmits<{ saved: [WeddingDetail] }>();

const { t } = useI18n();

/** Formulář pracuje s řetězci; převod na čísla řeší až odesílání. */
function personForm(person: WeddingDetail['groom'] | undefined) {
  return reactive({
    firstName: person?.firstName ?? '',
    lastName: person?.lastName ?? '',
    birthYear: person?.birthYear ? String(person.birthYear) : '',
    email: person?.email ?? '',
    phone: person?.phone ?? '',
    note: person?.note ?? '',
  });
}

const title = ref(props.wedding?.title ?? '');
const weddingDate = ref(props.wedding?.weddingDate ?? '');
const groom = personForm(props.wedding?.groom);
const bride = personForm(props.wedding?.bride);

/*
 * Chyby se drží jako klíče hlášek a překládají se až při vykreslení,
 * aby po přepnutí jazyka nezůstaly v původním jazyce.
 */
const errors = ref<Record<string, string>>({});
const generalError = ref('');
const busy = ref(false);
const savedAt = ref<Date | null>(null);

function fieldError(field: string): string | undefined {
  const key = errors.value[field];
  return key ? translateMessage(key) : undefined;
}

function toPerson(form: ReturnType<typeof personForm>) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    birthYear: form.birthYear.trim() === '' ? undefined : Number(form.birthYear),
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    note: form.note.trim() || undefined,
  };
}

async function submit(): Promise<void> {
  errors.value = {};
  generalError.value = '';
  busy.value = true;

  try {
    const wedding = await props.save({
      title: title.value.trim(),
      weddingDate: weddingDate.value.trim() || undefined,
      groom: toPerson(groom),
      bride: toPerson(bride),
    });

    savedAt.value = new Date();
    emit('saved', wedding);
  } catch (cause) {
    if (cause instanceof ApiError && cause.details.length > 0) {
      errors.value = cause.fieldErrors;
    } else {
      generalError.value =
        cause instanceof ApiError ? cause.message : 'weddy.weddingForm.saveFailed';
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <section v-if="withSettings" class="card block">
      <h2>{{ t('weddy.weddingForm.wedding') }}</h2>
      <FormField
        v-model="title"
        :label="t('weddy.weddingForm.title')"
        required
        :disabled="readonly"
        :error="fieldError('title')"
      />
      <FormField
        v-model="weddingDate"
        :label="t('weddy.weddingForm.date')"
        type="date"
        :disabled="readonly"
        :error="fieldError('weddingDate')"
      />
    </section>

    <section v-for="side in [{ key: 'groom', form: groom, heading: t('weddy.weddingForm.groom') }, { key: 'bride', form: bride, heading: t('weddy.weddingForm.bride') }]" :key="side.key" class="card block">
      <h2>{{ side.heading }}</h2>

      <div class="row">
        <FormField
          v-model="side.form.firstName"
          :label="t('weddy.weddingForm.firstName')"
          required
          :disabled="readonly"
          :error="fieldError(`${side.key}.firstName`)"
        />
        <FormField
          v-model="side.form.lastName"
          :label="t('weddy.weddingForm.lastName')"
          required
          :disabled="readonly"
          :error="fieldError(`${side.key}.lastName`)"
        />
      </div>

      <FormField
        v-model="side.form.birthYear"
        :label="t('weddy.weddingForm.birthYear')"
        numeric
        :disabled="readonly"
        :error="fieldError(`${side.key}.birthYear`)"
      />
      <FormField
        v-model="side.form.email"
        :label="t('weddy.weddingForm.email')"
        type="email"
        :disabled="readonly"
        :error="fieldError(`${side.key}.email`)"
      />
      <FormField
        v-model="side.form.phone"
        :label="t('weddy.weddingForm.phone')"
        type="tel"
        :disabled="readonly"
        :error="fieldError(`${side.key}.phone`)"
      />
      <FormField
        v-model="side.form.note"
        :label="t('weddy.weddingForm.note')"
        textarea
        :disabled="readonly"
        :error="fieldError(`${side.key}.note`)"
      />
    </section>

    <p v-if="generalError" class="general-error" role="alert">{{ translateMessage(generalError) }}</p>

    <div v-if="!readonly" class="actions">
      <button type="submit" class="btn btn-primary" :disabled="busy">
        {{ busy ? t('weddy.weddingForm.saving') : submitLabel }}
      </button>
      <p v-if="savedAt" class="saved" role="status">
        {{ t('weddy.weddingForm.savedAt', { time: savedAt.toLocaleTimeString(currentLocale) }) }}
      </p>
    </div>
  </form>
</template>

<style scoped>
.form {
  display: grid;
  gap: var(--space-2);
}

.block {
  display: grid;
  gap: var(--space-2);
}

.block h2 {
  font-size: 1.25rem;
}

.row {
  display: grid;
  gap: var(--space-2);
}

.general-error {
  padding: var(--space-2);
  border: 1px solid #eecdc7;
  border-radius: var(--radius-sm);
  background: #fbeeeb;
  color: #96412f;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.saved {
  color: var(--color-success);
  font-size: 0.875rem;
}

@media (--tablet) {
  .row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
