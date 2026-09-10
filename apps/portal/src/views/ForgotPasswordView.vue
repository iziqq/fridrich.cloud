<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import AuthField from '@/components/AuthField.vue';
import CyberButton from '@/components/CyberButton.vue';
import { ApiError, useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

const email = ref('');
const done = ref('');
const error = ref('');
const busy = ref(false);

async function submit(): Promise<void> {
  error.value = '';
  busy.value = true;

  try {
    done.value = await auth.forgotPassword({ email: email.value.trim() });
  } catch (cause) {
    error.value =
      cause instanceof ApiError ? cause.message : 'Nepodařilo se odeslat. Zkuste to prosím znovu.';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthCard label="// Obnova hesla" title="Zapomenuté heslo">
    <!-- Odpověď je stejná i pro neznámou adresu – neprozradí, kdo je registrovaný. -->
    <p v-if="done" class="mono ok">&gt; {{ done }}</p>

    <form v-else novalidate @submit.prevent="submit">
      <p class="lead">
        Zadejte e-mail, kterým se přihlašujete. Pošleme na něj odkaz pro nastavení
        nového hesla.
      </p>

      <AuthField v-model="email" label="E-mail" type="email" autocomplete="email" />

      <p v-if="error" class="error mono" role="alert">&gt; {{ error }}</p>

      <CyberButton type="submit" :disabled="busy">
        {{ busy ? 'Odesílám…' : 'Odeslat odkaz' }}
      </CyberButton>
    </form>

    <template #footer>
      <p><RouterLink to="/prihlaseni">Zpět na přihlášení</RouterLink></p>
    </template>
  </AuthCard>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lead {
  color: var(--cp-muted);
}

.error {
  color: var(--cp-magenta);
}

.ok {
  color: var(--cp-green);
}
</style>
