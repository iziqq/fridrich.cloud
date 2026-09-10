<script setup lang="ts">
import { PASSWORD_MIN_LENGTH } from '@fridrich/shared';
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import AuthField from '@/components/AuthField.vue';
import CyberButton from '@/components/CyberButton.vue';
import { ApiError, useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

const displayName = ref('');
const email = ref('');
const password = ref('');
const fieldErrors = ref<Record<string, string>>({});
const generalError = ref('');
const done = ref('');
const busy = ref(false);

// Backend hlásí chyby s prefixem pole, frontend je zobrazuje u konkrétního vstupu.
const nameError = computed(() => fieldErrors.value['displayName']);
const emailError = computed(() => fieldErrors.value['email']);
const passwordError = computed(() => fieldErrors.value['password']);

async function submit(): Promise<void> {
  fieldErrors.value = {};
  generalError.value = '';
  busy.value = true;

  try {
    done.value = await auth.register({
      displayName: displayName.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });
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
        Otevřete odkaz v e-mailu a účet se aktivuje. Pak se můžete
        <RouterLink to="/prihlaseni">přihlásit</RouterLink>.
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
        :error="emailError"
      />
      <AuthField
        v-model="password"
        label="Heslo"
        type="password"
        autocomplete="new-password"
        :hint="`Alespoň ${PASSWORD_MIN_LENGTH} znaků`"
        :error="passwordError"
      />

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

.ok {
  color: var(--cp-green);
}

.done p:not(.ok) {
  color: var(--cp-muted);
}
</style>
