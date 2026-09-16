<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import type { Project } from '@/content/site';

defineProps<{ project: Project }>();

const { t } = useI18n();
</script>

<template>
  <article class="project glass">
    <div class="head">
      <div>
        <h3>{{ project.name }}</h3>
        <p class="mono tagline">{{ t(`portal.projects.items.${project.id}.tagline`) }}</p>
      </div>

      <!-- Stav je rozlišený barvou i textem, ne jen barvou (přístupnost). -->
      <span class="status mono" :class="project.status">
        {{ t(`portal.projects.status.${project.status}`) }}
      </span>
    </div>

    <p class="description">{{ t(`portal.projects.items.${project.id}.description`) }}</p>

    <ul class="stack">
      <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
    </ul>

    <div class="actions">
      <RouterLink :to="`/projekty/${project.id}`" class="link">{{ t('portal.projects.detail') }}</RouterLink>
      <a v-if="project.url" :href="project.url" class="link primary">
        {{ t('portal.projects.openAppExternal') }}
      </a>
    </div>
  </article>
</template>

<style scoped>
.project {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition:
    border-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.project:hover {
  border-color: var(--color-border-strong);
  transform: translateY(-2px);
}

.head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: flex-start;
  justify-content: space-between;
}

h3 {
  font-size: 1.5rem;
}

.tagline {
  color: var(--color-muted);
}

/* Stav jako pilulka s barevnou tečkou – barva i text, ne jen barva. */
.status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
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
  color: var(--color-muted);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

/* Technologie jako skleněné pilulky – drobné, tlumené, ať nepřebíjí nadpis. */
.stack li {
  padding: 0.25rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: var(--text-xs);
  font-weight: 500;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-1);
}

.link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-weight: 600;
  text-decoration: none;
}

.link:hover {
  color: var(--color-accent);
}

.link.primary {
  color: var(--color-accent);
}
</style>
