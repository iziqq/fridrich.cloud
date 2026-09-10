<script setup lang="ts">
import GlitchHeading from '@/components/GlitchHeading.vue';
import ProjectCard from '@/components/ProjectCard.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { projects } from '@/content/site';
import { useReveal } from '@/composables/useReveal';

const { el, visible } = useReveal();
</script>

<template>
  <section id="projekty" class="section" aria-labelledby="projekty-title">
    <div ref="el" class="container reveal" :class="{ 'is-visible': visible }">
      <SectionLabel :text="projects.label" />
      <GlitchHeading :text="projects.title" :level="2" />
      <span id="projekty-title" class="visually-hidden">{{ projects.title }}</span>
      <p class="lead">{{ projects.lead }}</p>

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
  color: var(--cp-muted);
}

.grid {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

@media (min-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
