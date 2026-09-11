<script setup lang="ts">
import type { Wedding, WeddingInput } from '@fridrich/weddy-shared';
import { reactive, ref } from 'vue';
import FormField from '@/weddy/components/FormField.vue';
import { ApiError } from '@/weddy/api';

const props = defineProps<{
  wedding?: Wedding | null;
  submitLabel: string;
  /** Vytvoření i úprava sdílí formulář, liší se jen tímhle voláním. */
  save: (input: WeddingInput) => Promise<Wedding>;
}>();

const emit = defineEmits<{ saved: [Wedding] }>();

/** Formulář pracuje s řetězci; převod na čísla řeší až odesílání. */
function personForm(person: Wedding['groom'] | undefined) {
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

const errors = ref<Record<string, string>>({});
const generalError = ref('');
const busy = ref(false);
const savedAt = ref('');

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

    savedAt.value = new Date().toLocaleTimeString('cs-CZ');
    emit('saved', wedding);
  } catch (cause) {
    if (cause instanceof ApiError && cause.details.length > 0) {
      errors.value = cause.fieldErrors;
    } else {
      generalError.value =
        cause instanceof ApiError ? cause.message : 'Uložení se nepodařilo.';
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <section class="card block">
      <h2>Svatba</h2>
      <FormField v-model="title" label="Název svatby" required :error="errors['title']" />
      <FormField
        v-model="weddingDate"
        label="Datum svatby"
        type="date"
        :error="errors['weddingDate']"
      />
    </section>

    <section v-for="side in [{ key: 'groom', form: groom, heading: 'Ženich' }, { key: 'bride', form: bride, heading: 'Nevěsta' }]" :key="side.key" class="card block">
      <h2>{{ side.heading }}</h2>

      <div class="row">
        <FormField
          v-model="side.form.firstName"
          label="Jméno"
          required
          :error="errors[`${side.key}.firstName`]"
        />
        <FormField
          v-model="side.form.lastName"
          label="Příjmení"
          required
          :error="errors[`${side.key}.lastName`]"
        />
      </div>

      <FormField
        v-model="side.form.birthYear"
        label="Rok narození"
        numeric
        :error="errors[`${side.key}.birthYear`]"
      />
      <FormField
        v-model="side.form.email"
        label="E-mail"
        type="email"
        :error="errors[`${side.key}.email`]"
      />
      <FormField
        v-model="side.form.phone"
        label="Telefon"
        type="tel"
        :error="errors[`${side.key}.phone`]"
      />
      <FormField
        v-model="side.form.note"
        label="Poznámka"
        textarea
        :error="errors[`${side.key}.note`]"
      />
    </section>

    <p v-if="generalError" class="general-error" role="alert">{{ generalError }}</p>

    <div class="actions">
      <button type="submit" class="btn btn-primary" :disabled="busy">
        {{ busy ? 'Ukládám…' : submitLabel }}
      </button>
      <p v-if="savedAt" class="saved" role="status">Uloženo v {{ savedAt }}</p>
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

@media (min-width: 560px) {
  .row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
