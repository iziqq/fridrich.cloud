<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { Project } from '@/content/site';

defineProps<{ project: Project }>();
</script>

<template>
  <article class="project bevel">
    <div class="head">
      <div>
        <h3>{{ project.name }}</h3>
        <p class="mono tagline">{{ project.tagline }}</p>
      </div>

      <!-- Stav je rozlišený barvou i textem, ne jen barvou (přístupnost). -->
      <span class="status mono" :class="project.status">{{ project.statusLabel }}</span>
    </div>

    <p class="description">{{ project.description }}</p>

    <ul class="stack mono">
      <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
    </ul>

    <div class="actions">
      <RouterLink :to="`/projekty/${project.id}`" class="link">Detail projektu</RouterLink>
      <a v-if="project.url" :href="project.url" class="link primary">
        Otevřít aplikaci ↗
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
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
  transition:
    border-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.project:hover {
  border-color: var(--cp-yellow);
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
  color: var(--cp-yellow);
  font-size: 1.5rem;
}

.tagline {
  color: var(--cp-muted);
}

.status {
  padding: 0.25rem 0.65rem;
  border: 1px solid currentColor;
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
  color: var(--cp-muted);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
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
  margin-top: var(--space-1);
}

.link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  color: var(--cp-text);
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}

.link:hover {
  color: var(--cp-yellow);
}

.link.primary {
  color: var(--cp-yellow);
}
</style>
