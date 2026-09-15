<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import AuthField from '@/components/AuthField.vue';
import CyberButton from '@/components/CyberButton.vue';
import { ApiError, useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

const displayName = ref('');
const email = ref('');
const fieldErrors = ref<Record<string, string>>({});
const generalError = ref('');
const done = ref('');
const busy = ref(false);

// Backend hlásí chyby s prefixem pole, frontend je zobrazuje u konkrétního vstupu.
const nameError = computed(() => fieldErrors.value['displayName']);
const emailError = computed(() => fieldErrors.value['email']);

async function submit(): Promise<void> {
  fieldErrors.value = {};
  generalError.value = '';
  busy.value = true;

  try {
    done.value = await auth.register({
      displayName: displayName.value.trim(),
      email: email.value.trim(),
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
