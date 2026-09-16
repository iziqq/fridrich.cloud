<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { budgyPath } from './routes';

const { t } = useI18n();
</script>

<template>
  <main id="obsah" class="container page">
    <h1>{{ t('budgy.notFound.title') }}</h1>
    <p>{{ t('budgy.notFound.text') }}</p>
    <RouterLink :to="budgyPath()" class="btn btn-primary">
      {{ t('budgy.notFound.back') }}
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
