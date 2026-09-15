<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import AppButton from '@/components/AppButton.vue';
import SectionHeading from '@/components/SectionHeading.vue';
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
      <SectionLabel :text="t(`portal.projects.items.${project.id}.tagline`)" />
      <SectionHeading :text="project.name" :level="1" />

      <p class="status mono" :class="project.status">{{ t(`portal.projects.status.${project.status}`) }}</p>
      <p class="description">{{ t(`portal.projects.items.${project.id}.description`) }}</p>

      <ul class="stack">
        <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
      </ul>

      <div class="actions">
        <AppButton v-if="project.url" :href="project.url">{{ t('portal.projects.openApp') }}</AppButton>
        <RouterLink to="/#projekty" class="back mono">{{ t('portal.projects.backToProjects') }}</RouterLink>
      </div>
    </div>

    <div v-else class="container">
      <SectionHeading :text="t('portal.projects.notFound')" :level="1" />
      <RouterLink to="/#projekty" class="back mono">{{ t('portal.projects.backToProjects') }}</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding-block: 10rem var(--section-gap);
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: var(--space-2);
  padding: 0.3rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
}

.status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status.development {
  color: var(--color-accent);
}

.status.planned {
  color: var(--color-accent-soft);
}

.status.live {
  color: var(--color-success);
}

.description {
  margin-top: var(--space-2);
  color: var(--color-muted);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-3);
}

/* Technologie jako skleněné pilulky – drobné, tlumené, ať nepřebíjí nadpis. */
.stack li {
  padding: 0.25rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 0.8125rem;
  font-weight: 500;
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
</style>
