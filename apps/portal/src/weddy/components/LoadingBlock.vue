<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <p class="loading" role="status">{{ t('weddy.components.loadingBlock.loading') }}</p>
</template>

<style scoped>
.loading {
  padding: var(--space-6) 0;
  color: var(--color-muted);
  text-align: center;
}
</style>
