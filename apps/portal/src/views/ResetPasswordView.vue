<script setup lang="ts">
import { PASSWORD_MIN_LENGTH } from '@fridrich/shared';
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import AuthField from '@/components/AuthField.vue';
import CyberButton from '@/components/CyberButton.vue';
import { ApiError, useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();

const token = computed(() => (typeof route.query['token'] === 'string' ? route.query['token'] : ''));

const password = ref('');
const fieldErrors = ref<Record<string, string>>({});
const generalError = ref('');
const done = ref(false);
const busy = ref(false);

async function submit(): Promise<void> {
  fieldErrors.value = {};
  generalError.value = '';
  busy.value = true;

  try {
    await auth.resetPassword({ token: token.value, password: password.value });
    done.value = true;
  } catch (cause) {
    if (cause instanceof ApiError && cause.details.length > 0) {
      fieldErrors.value = cause.fieldErrors;
      // Vadný token nepatří k žádnému poli formuláře.
      if (fieldErrors.value['token']) generalError.value = fieldErrors.value['token'];
    } else {
      generalError.value =
        cause instanceof ApiError ? cause.message : 'Nepodařilo se změnit heslo.';
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthCard label="// Obnova hesla" title="Nové heslo">
    <div v-if="done" class="done">
      <p class="mono ok">&gt; heslo změněno</p>
      <p>
        Kvůli bezpečnosti jsme vás odhlásili na všech zařízeních. Nyní se
        <RouterLink to="/prihlaseni">přihlaste</RouterLink> novým heslem.
      </p>
    </div>

    <p v-else-if="!token" class="error mono">
      &gt; odkaz je neúplný. Vyžádejte si nový přes zapomenuté heslo.
    </p>

    <form v-else novalidate @submit.prevent="submit">
      <AuthField
        v-model="password"
        label="Nové heslo"
        type="password"
        autocomplete="new-password"
        :hint="`Alespoň ${PASSWORD_MIN_LENGTH} znaků`"
        :error="fieldErrors['password']"
      />

      <p v-if="generalError" class="error mono" role="alert">&gt; {{ generalError }}</p>

      <CyberButton type="submit" :disabled="busy">
        {{ busy ? 'Ukládám…' : 'Nastavit heslo' }}
      </CyberButton>
    </form>

    <template #footer>
      <p><RouterLink to="/zapomenute-heslo">Vyžádat nový odkaz</RouterLink></p>
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
