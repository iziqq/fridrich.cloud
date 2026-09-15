<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import AuthCard from '@/components/AuthCard.vue';
import { ApiError } from '@/api/http';
import { translateMessage } from '@/i18n';
import { useAuthStore } from './auth.store';

const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();

type State = 'working' | 'done' | 'failed';

const state = ref<State>('working');
/** Klíč hlášky – překládá se až při vykreslení. */
const error = ref('');

// Ověření běží samo po otevření odkazu z e-mailu – uživatel nemá co vyplňovat.
onMounted(async () => {
  const token = typeof route.query['token'] === 'string' ? route.query['token'] : '';

  if (!token) {
    state.value = 'failed';
    error.value = 'identity.verifyEmail.incompleteLink';
    return;
  }

  try {
    await auth.activateAccount(token);
    state.value = 'done';
  } catch (cause) {
    state.value = 'failed';
    error.value =
      cause instanceof ApiError ? cause.message : 'identity.verifyEmail.failed';
  }
});
</script>

<template>
  <AuthCard :label="t('identity.verifyEmail.label')" :title="t('identity.verifyEmail.title')">
    <p v-if="state === 'working'" class="working">{{ t('identity.verifyEmail.working') }}</p>

    <div v-else-if="state === 'done'" class="block">
      <p class="ok">{{ t('identity.verifyEmail.done') }}</p>
      <p>{{ t('identity.verifyEmail.doneInfo') }}</p>
    </div>

    <div v-else class="block">
      <p class="error">{{ translateMessage(error) }}</p>
      <p>{{ t('identity.verifyEmail.failedInfo') }}</p>
    </div>

    <template #footer>
      <p>
        <RouterLink v-if="state === 'done'" to="/ucet">{{ t('identity.verifyEmail.goToAccount') }}</RouterLink>
        <RouterLink v-else to="/prihlaseni">{{ t('identity.verifyEmail.backToLogin') }}</RouterLink>
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
  color: var(--color-muted);
}

.error {
  color: var(--color-danger);
}

.ok {
  color: var(--color-success);
}
</style>
