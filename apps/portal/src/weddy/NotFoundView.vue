<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { weddyPath } from '@/weddy/routes';

const { t } = useI18n();
</script>

<template>
  <main id="obsah" class="container page">
    <h1>{{ t('weddy.notFound.title') }}</h1>
    <p>{{ t('weddy.notFound.text') }}</p>
    <RouterLink :to="weddyPath()" class="btn btn-primary">{{ t('weddy.notFound.back') }}</RouterLink>
  </main>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-2);
  place-content: center;
  min-height: 70svh;
  text-align: center;
}

p {
  margin-inline: auto;
  color: var(--color-muted);
}

.btn {
  justify-self: center;
}
</style>
