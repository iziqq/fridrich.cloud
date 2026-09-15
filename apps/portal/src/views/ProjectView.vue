<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import CyberButton from '@/components/CyberButton.vue';
import GlitchHeading from '@/components/GlitchHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { projects } from '@/content/site';

const route = useRoute();
const { t } = useI18n();

const project = computed(() =>
  projects.items.find((item) => item.id === route.params['id']),
);
</script>

<template>
  <section class="page">
    <div v-if="project" class="container">
      <SectionLabel :text="'// ' + t(`portal.projects.items.${project.id}.tagline`)" />
      <GlitchHeading :text="project.name" :level="1" />

      <p class="status mono" :class="project.status">{{ t(`portal.projects.status.${project.status}`) }}</p>
      <p class="description">{{ t(`portal.projects.items.${project.id}.description`) }}</p>

      <ul class="stack mono">
        <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
      </ul>

      <div class="actions">
        <CyberButton v-if="project.url" :href="project.url">{{ t('portal.projects.openApp') }}</CyberButton>
        <RouterLink to="/#projekty" class="back mono">{{ t('portal.projects.backToProjects') }}</RouterLink>
      </div>
    </div>

    <div v-else class="container">
      <GlitchHeading :text="t('portal.projects.notFound')" :level="1" />
      <RouterLink to="/#projekty" class="back mono">{{ t('portal.projects.backToProjects') }}</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding-block: 10rem var(--section-gap);
}

.status {
  margin-top: var(--space-2);
}

.status.development {
  color: var(--cp-yellow);
}

.status.planned {
  color: var(--cp-cyan);
}

.status.live {
  color: var(--cp-green);
}

.description {
  margin-top: var(--space-2);
  color: var(--cp-muted);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-3);
}

.stack li {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--cp-line);
  color: var(--cp-cyan);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  margin-top: var(--space-4);
}

.back {
  color: var(--cp-muted);
  text-decoration: none;
}

.back:hover {
  color: var(--cp-yellow);
}
</style>
