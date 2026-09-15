<script setup lang="ts">
import SectionHeading from '@/components/SectionHeading.vue';
import ProjectCard from '@/components/ProjectCard.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { useI18n } from 'vue-i18n';
import { projects } from '@/content/site';
import { useReveal } from '@/composables/useReveal';

const { t } = useI18n();
const { el, visible } = useReveal();
</script>

<template>
  <section id="projekty" class="section" aria-labelledby="projekty-title">
    <div ref="el" class="container reveal" :class="{ 'is-visible': visible }">
      <SectionLabel :text="t('portal.projects.label')" />
      <SectionHeading :text="t('portal.projects.title')" :level="2" />
      <span id="projekty-title" class="visually-hidden">{{ t('portal.projects.title') }}</span>
      <p class="lead">{{ t('portal.projects.lead') }}</p>

      <div class="grid">
        <ProjectCard v-for="project in projects.items" :key="project.id" :project="project" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding-block: var(--section-gap);
}

.lead {
  margin-top: var(--space-2);
  color: var(--color-muted);
}

.grid {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

@media (--tablet) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
