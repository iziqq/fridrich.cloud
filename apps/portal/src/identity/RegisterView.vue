<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import AuthField from '@/components/AuthField.vue';
import AppButton from '@/components/AppButton.vue';
import { ApiError } from '@/api/http';
import { translateMessage } from '@/i18n';
import { register } from './endpoints/register.endpoint';

const { t } = useI18n();

const displayName = ref('');
const email = ref('');
const acceptTerms = ref(false);
// Hlášky se drží jako klíče a překládají se až při vykreslení – přepnutí jazyka je přeloží znovu.
const fieldErrors = ref<Record<string, string>>({});
const generalError = ref('');
const done = ref('');
const busy = ref(false);

// Chyby chodí po polích – ze schématu ještě před odesláním, nebo z backendu.
const nameError = computed(() => fieldError('displayName'));
const emailError = computed(() => fieldError('email'));
const termsError = computed(() => fieldError('acceptTerms'));

function fieldError(field: string): string | undefined {
  const key = fieldErrors.value[field];
  // Bez chyby musí zůstat `undefined` – `translateMessage` by prázdný klíč nahradil obecnou hláškou.
  return key ? translateMessage(key) : undefined;
}

async function submit(): Promise<void> {
  fieldErrors.value = {};
  generalError.value = '';
  busy.value = true;

  try {
    const response = await register({
      displayName: displayName.value,
      email: email.value,
      // Schéma pustí jen `true` – nezaškrtnutý souhlas skončí chybou u pole ještě před odesláním.
      acceptTerms: acceptTerms.value as true,
    });
    done.value = response.message;
  } catch (cause) {
    if (cause instanceof ApiError && cause.details.length > 0) {
      fieldErrors.value = cause.fieldErrors;
    } else {
      generalError.value =
        cause instanceof ApiError ? cause.message : 'identity.register.failed';
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthCard :label="t('identity.register.label')" :title="t('identity.register.title')">
    <!--
      Po odeslání se formulář schová. Odpověď je stejná i pro obsazený e-mail,
      takže z ní nejde zjistit, kdo je registrovaný.
    -->
    <div v-if="done" class="done">
      <p class="ok">{{ translateMessage(done) }}</p>
      <i18n-t keypath="identity.register.doneInfo" tag="p">
        <template #link>
          <RouterLink to="/prihlaseni">{{ t('identity.register.doneInfoLink') }}</RouterLink>
        </template>
      </i18n-t>
    </div>

    <form v-else novalidate @submit.prevent="submit">
      <AuthField
        v-model="displayName"
        :label="t('identity.register.nameLabel')"
        autocomplete="name"
        :error="nameError"
      />
      <AuthField
        v-model="email"
        :label="t('identity.email')"
        type="email"
        autocomplete="email"
        :hint="t('identity.register.emailHint')"
        :error="emailError"
      />

      <div class="terms">
        <label class="checkbox">
          <input
            v-model="acceptTerms"
            type="checkbox"
            name="acceptTerms"
            :aria-invalid="Boolean(termsError)"
            :aria-describedby="termsError ? 'register-terms-error' : undefined"
          />
          <i18n-t keypath="identity.register.acceptTerms" tag="span">
            <template #link>
              <RouterLink to="/obchodni-podminky" target="_blank">{{ t('identity.register.acceptTermsLink') }}</RouterLink>
            </template>
          </i18n-t>
        </label>
        <p v-if="termsError" id="register-terms-error" class="error">{{ termsError }}</p>
        <i18n-t keypath="identity.register.privacyInfo" tag="p" class="info">
          <template #link>
            <RouterLink to="/ochrana-osobnich-udaju" target="_blank">{{ t('identity.register.privacyInfoLink') }}</RouterLink>
          </template>
        </i18n-t>
      </div>

      <p v-if="generalError" class="error" role="alert">{{ translateMessage(generalError) }}</p>

      <AppButton type="submit" :disabled="busy">
        {{ busy ? t('identity.register.submitting') : t('identity.register.submit') }}
      </AppButton>
    </form>

    <template #footer>
      <i18n-t keypath="identity.register.hasAccount" tag="p">
        <template #link>
          <RouterLink to="/prihlaseni">{{ t('identity.register.loginLink') }}</RouterLink>
        </template>
      </i18n-t>
    </template>
  </AuthCard>
</template>

<style scoped>
form,
.done {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.error {
  color: var(--color-danger);
}

.terms {
  display: grid;
  gap: 0.35rem;
}

/* Celý řádek je klikací, ať se checkbox trefí i prstem (min. 44 px). */
.checkbox {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  min-height: var(--touch-target);
  cursor: pointer;
}

.checkbox input {
  flex: none;
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-accent);
}

.terms a {
  color: var(--color-accent-soft);
}

.info {
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.ok {
  color: var(--color-success);
}

.done p:not(.ok) {
  color: var(--color-muted);
}
</style>
