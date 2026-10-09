<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { maptapPath } from './routes';

const { t } = useI18n();
</script>

<template>
  <main id="obsah" class="container page">
    <h1>{{ t('maptap.notFound.title') }}</h1>
    <p>{{ t('maptap.notFound.text') }}</p>
    <RouterLink :to="maptapPath()" class="btn btn-primary">
      {{ t('maptap.notFound.back') }}
    </RouterLink>
  </main>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-2);
  justify-items: start;
}
</style>
