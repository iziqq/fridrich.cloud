<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import SectionHeading from '@/components/SectionHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';

const { t } = useI18n();
</script>

<template>
  <section class="page">
    <div class="container">
      <SectionLabel :text="t('portal.notFound.label')" />
      <SectionHeading :text="t('portal.notFound.title')" :level="1" />
      <p class="lead">{{ t('portal.notFound.lead') }}</p>
      <RouterLink to="/" class="back mono">{{ t('portal.notFound.back') }}</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  place-items: center;
  min-height: 70svh;
  padding-block: 10rem var(--section-gap);
}

.lead {
  margin-top: var(--space-2);
  color: var(--color-danger);
}

.back {
  display: inline-block;
  margin-top: var(--space-3);
  color: var(--color-muted);
  text-decoration: none;
}

.back:hover {
  color: var(--color-accent);
}
</style>
