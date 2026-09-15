<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import AuthField from '@/components/AuthField.vue';
import CyberButton from '@/components/CyberButton.vue';
import { ApiError } from '@/api/http';
import { register } from './endpoints/register.endpoint';

const displayName = ref('');
const email = ref('');
const acceptTerms = ref(false);
const fieldErrors = ref<Record<string, string>>({});
const generalError = ref('');
const done = ref('');
const busy = ref(false);

// Chyby chodí po polích – ze schématu ještě před odesláním, nebo z backendu.
const nameError = computed(() => fieldErrors.value['displayName']);
const emailError = computed(() => fieldErrors.value['email']);
const termsError = computed(() => fieldErrors.value['acceptTerms']);

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
        cause instanceof ApiError ? cause.message : 'Registrace selhala. Zkuste to prosím znovu.';
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthCard label="// Registrace" title="Vytvořit účet">
    <!--
      Po odeslání se formulář schová. Odpověď je stejná i pro obsazený e-mail,
      takže z ní nejde zjistit, kdo je registrovaný.
    -->
    <div v-if="done" class="done">
      <p class="mono ok">&gt; {{ done }}</p>
      <p>
        Otevřete odkaz v e-mailu – účet se aktivuje a rovnou vás přihlásíme.
        Příště se přihlásíte <RouterLink to="/prihlaseni">kódem na e-mail</RouterLink>.
      </p>
    </div>

    <form v-else novalidate @submit.prevent="submit">
      <AuthField
        v-model="displayName"
        label="Jméno"
        autocomplete="name"
        :error="nameError"
      />
      <AuthField
        v-model="email"
        label="E-mail"
        type="email"
        autocomplete="email"
        hint="Sem pošleme aktivační odkaz i přihlašovací kódy"
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
          <span>
            Souhlasím s
            <RouterLink to="/obchodni-podminky" target="_blank">obchodními podmínkami</RouterLink>
          </span>
        </label>
        <p v-if="termsError" id="register-terms-error" class="error mono">{{ termsError }}</p>
        <p class="info">
          Jak s vaším jménem a e-mailem zacházím, popisují
          <RouterLink to="/ochrana-osobnich-udaju" target="_blank">zásady ochrany osobních údajů</RouterLink>.
        </p>
      </div>

      <p v-if="generalError" class="error mono" role="alert">&gt; {{ generalError }}</p>

      <CyberButton type="submit" :disabled="busy">
        {{ busy ? 'Zakládám účet…' : 'Vytvořit účet' }}
      </CyberButton>
    </form>

    <template #footer>
      <p>Už máte účet? <RouterLink to="/prihlaseni">Přihlaste se</RouterLink></p>
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
  color: var(--cp-magenta);
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
  accent-color: var(--cp-yellow);
}

.terms a {
  color: var(--cp-cyan);
}

.info {
  color: var(--cp-muted);
  font-size: 0.8125rem;
}

.ok {
  color: var(--cp-green);
}

.done p:not(.ok) {
  color: var(--cp-muted);
}
</style>
