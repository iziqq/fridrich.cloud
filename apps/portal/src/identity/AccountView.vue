<script setup lang="ts">
import { INACTIVE_ACCOUNT_RETENTION_DAYS } from '@fridrich/shared';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';
import AppButton from '@/components/AppButton.vue';
import SectionHeading from '@/components/SectionHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { ApiError } from '@/api/http';
import { projects } from '@/content/site';
import { translateMessage } from '@/i18n';
import { useAuthStore } from './auth.store';

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const busy = ref(false);

/** Smazání je nevratné, takže má dva kroky: tlačítko a potom výslovné potvrzení. */
const deleteStep = ref<'idle' | 'confirm' | 'deleting' | 'deleted'>('idle');
/** Klíč hlášky – překládá se až při vykreslení. */
const deleteError = ref('');
/** Adresa se po smazání z store vytratí – potvrzení ji ale ještě ukazuje. */
const deletedEmail = ref('');

async function signOut(): Promise<void> {
  busy.value = true;
  await auth.signOut();
  await router.push('/');
}

async function confirmDelete(): Promise<void> {
  deleteError.value = '';
  deleteStep.value = 'deleting';
  const email = auth.user?.email ?? '';

  try {
    await auth.closeAccount();
    deletedEmail.value = email;
    deleteStep.value = 'deleted';
  } catch (cause) {
    deleteStep.value = 'confirm';
    deleteError.value =
      cause instanceof ApiError ? cause.message : 'identity.account.delete.failed';
  }
}
</script>

<template>
  <section class="page">
    <!-- Po smazání účtu už uživatel není přihlášený – zbývá jen potvrzení. -->
    <div v-if="deleteStep === 'deleted'" class="container">
      <SectionLabel :text="t('identity.account.deleted.label')" />
      <SectionHeading :text="t('identity.account.deleted.title')" :level="1" />
      <p class="ok done" role="status">
        {{ t('identity.account.deleted.info', { email: deletedEmail }) }}
      </p>
      <div class="actions">
        <RouterLink to="/" class="back mono">{{ t('identity.account.backToWeb') }}</RouterLink>
      </div>
    </div>

    <div v-else class="container">
      <SectionLabel :text="t('identity.account.label')" />
      <SectionHeading :text="auth.user?.displayName ?? t('identity.account.fallbackName')" :level="1" />

      <dl class="details glass">
        <div>
          <dt class="mono">{{ t('identity.email') }}</dt>
          <dd>{{ auth.user?.email }}</dd>
        </div>
        <div>
          <dt class="mono">{{ t('identity.account.status') }}</dt>
          <dd :class="auth.user?.emailVerified ? 'ok' : 'warn'">
            {{ auth.user?.emailVerified ? t('identity.account.emailVerified') : t('identity.account.emailNotVerified') }}
          </dd>
        </div>
      </dl>

      <!-- Rozcestník do produktů – jeden účet platí na všech subdoménách. -->
      <h2 class="apps-title">{{ t('identity.account.appsTitle') }}</h2>
      <ul class="apps">
        <li v-for="project in projects.items" :key="project.id" class="app glass">
          <div>
            <p class="name">{{ project.name }}</p>
            <p class="mono tagline">{{ t(`portal.projects.items.${project.id}.tagline`) }}</p>
          </div>
          <a v-if="project.url" :href="project.url" class="open">{{ t('identity.account.openApp') }}</a>
          <span v-else class="mono soon">{{ t(`portal.projects.status.${project.status}`) }}</span>
        </li>
      </ul>

      <div class="actions">
        <AppButton variant="ghost" :disabled="busy" @click="signOut">
          {{ busy ? t('identity.account.signingOut') : t('identity.account.signOut') }}
        </AppButton>
        <RouterLink to="/" class="back mono">{{ t('identity.account.backToWeb') }}</RouterLink>
      </div>

      <!-- Právo na výmaz (čl. 17 GDPR) – uživatel si účet smaže sám, bez žádosti e-mailem. -->
      <section class="danger glass" aria-labelledby="delete-title">
        <h2 id="delete-title" class="danger-title">{{ t('identity.account.delete.title') }}</h2>
        <p>{{ t('identity.account.delete.description') }}</p>
        <i18n-t keypath="identity.account.delete.retention" tag="p" class="note">
          <template #days>{{ INACTIVE_ACCOUNT_RETENTION_DAYS }}</template>
          <template #link>
            <RouterLink to="/ochrana-osobnich-udaju">{{ t('identity.account.delete.retentionLink') }}</RouterLink>
          </template>
        </i18n-t>

        <button
          v-if="deleteStep === 'idle'"
          type="button"
          class="danger-button"
          @click="deleteStep = 'confirm'"
        >
          {{ t('identity.account.delete.button') }}
        </button>

        <div v-else class="confirm" role="group" :aria-label="t('identity.account.delete.confirmGroup')">
          <p class="warn">{{ t('identity.account.delete.confirm', { email: auth.user?.email }) }}</p>
          <p v-if="deleteError" class="error" role="alert">{{ translateMessage(deleteError) }}</p>
          <div class="confirm-actions">
            <button
              type="button"
              class="danger-button"
              :disabled="deleteStep === 'deleting'"
              @click="confirmDelete"
            >
              {{ deleteStep === 'deleting' ? t('identity.account.delete.deleting') : t('identity.account.delete.confirmButton') }}
            </button>
            <AppButton
              variant="ghost"
              :disabled="deleteStep === 'deleting'"
              @click="deleteStep = 'idle'"
            >
              {{ t('identity.account.delete.cancel') }}
            </AppButton>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding-block: 10rem var(--section-gap);
}

.details {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

dt {
  color: var(--color-accent-soft);
}

dd {
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.ok {
  color: var(--color-success);
}

.warn {
  color: var(--color-accent);
}

.error {
  color: var(--color-danger);
}

.done {
  margin-top: var(--space-3);
}

.apps-title {
  margin-top: var(--space-6);
  font-size: var(--text-h3);
}

.apps {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.app {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.tagline {
  color: var(--color-muted);
}

.open {
  color: var(--color-accent);
  font-family: var(--font-display);
  font-weight: 600;
  text-decoration: none;
}

.soon {
  color: var(--color-accent-soft);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  margin-top: var(--space-4);
}

.back {
  color: var(--color-muted);
  text-decoration: none;
}

.back:hover {
  color: var(--color-accent);
}

/* --- Nebezpečná zóna: magenta = chyba a nevratná akce, žlutá zůstává jen pro hlavní CTA --- */

.danger {
  display: grid;
  gap: var(--space-2);
  max-width: 44rem;
  margin-top: var(--space-8);
  padding: var(--space-3);
  border: 1px solid color-mix(in srgb, var(--color-danger) 45%, var(--color-border));
  background: var(--color-surface);
}

.danger-title {
  color: var(--color-danger);
  font-size: var(--text-h3);
}

.danger p {
  color: var(--color-muted);
}

.danger .note {
  font-size: var(--text-sm);
}

.danger a {
  color: var(--color-accent-soft);
}

.danger-button {
  justify-self: start;
  min-height: var(--touch-target);
  padding: 0.6rem 1.25rem;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-danger);
  font-weight: 600;
  cursor: pointer;
  transition:
    background var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);
}

.danger-button:hover:not(:disabled) {
  background: var(--color-danger);
  color: var(--color-bg);
}

.danger-button:disabled {
  opacity: 0.6;
  cursor: progress;
}

.confirm {
  display: grid;
  gap: var(--space-2);
}

.confirm .warn {
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.confirm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

@media (--tablet) {
  .details {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
