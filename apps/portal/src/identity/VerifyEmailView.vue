<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import { ApiError, useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();

type State = 'working' | 'done' | 'failed';

const state = ref<State>('working');
const error = ref('');

// Ověření běží samo po otevření odkazu z e-mailu – uživatel nemá co vyplňovat.
onMounted(async () => {
  const token = typeof route.query['token'] === 'string' ? route.query['token'] : '';

  if (!token) {
    state.value = 'failed';
    error.value = 'Odkaz je neúplný.';
    return;
  }

  try {
    await auth.verifyEmail(token);
    state.value = 'done';
  } catch (cause) {
    state.value = 'failed';
    error.value =
      cause instanceof ApiError ? cause.message : 'Ověření se nepodařilo.';
  }
});
</script>

<template>
  <AuthCard label="// Aktivace účtu" title="Aktivace účtu">
    <p v-if="state === 'working'" class="mono caret">&gt; ověřuji</p>

    <div v-else-if="state === 'done'" class="block">
      <p class="mono ok">&gt; účet aktivován</p>
      <p>Rovnou jsme vás přihlásili. Můžete se pustit do práce.</p>
    </div>

    <div v-else class="block">
      <p class="mono error">&gt; {{ error }}</p>
      <p>
        Odkaz platí 24 hodin a jde použít jen jednou. Do účtu se dostanete i
        přihlášením – pošleme vám kód na e-mail.
      </p>
    </div>

    <template #footer>
      <p>
        <RouterLink v-if="state === 'done'" to="/ucet">Přejít na účet</RouterLink>
        <RouterLink v-else to="/prihlaseni">Zpět na přihlášení</RouterLink>
      </p>
    </template>
  </AuthCard>
</template>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.block p:not(.mono) {
  color: var(--cp-muted);
}

.error {
  color: var(--cp-magenta);
}

.ok {
  color: var(--cp-green);
}
</style>
