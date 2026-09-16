<script setup lang="ts">
import type { Wedding } from '@fridrich/weddy-shared';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';
import { weddyPath } from '@/weddy/routes';
import WeddingForm from './WeddingForm.vue';
import { useWeddingStore } from './wedding.store';

const { t } = useI18n();
const weddings = useWeddingStore();
const router = useRouter();

async function onSaved(wedding: Wedding): Promise<void> {
  await router.replace(weddyPath(`/weddings/${wedding.id}/couple`));
}
</script>

<template>
  <main id="obsah" class="page-new container">
    <RouterLink :to="weddyPath()" class="back">{{ t('weddy.weddingNew.back') }}</RouterLink>
    <h1>{{ t('weddy.weddingNew.title') }}</h1>
    <p class="lead">{{ t('weddy.weddingNew.lead') }}</p>

    <WeddingForm
      with-settings
      :submit-label="t('weddy.weddingNew.submit')"
      :save="(input) => weddings.create(input)"
      @saved="onSaved"
    />
  </main>
</template>

<style scoped>
.page-new {
  padding-block: var(--space-3) var(--space-8);
}

.back {
  display: inline-block;
  margin-bottom: var(--space-2);
  color: var(--color-muted);
  font-size: var(--text-sm);
  text-decoration: none;
}

.back:hover {
  color: var(--color-accent);
}

h1 {
  font-size: 1.75rem;
}

.lead {
  margin-bottom: var(--space-3);
  color: var(--color-muted);
}
</style>
