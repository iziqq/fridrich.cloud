<script setup lang="ts">
import GlitchHeading from '@/components/GlitchHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { services } from '@/content/site';
import { useReveal } from '@/composables/useReveal';

const { el, visible } = useReveal();
</script>

<template>
  <section id="sluzby" class="section" aria-labelledby="sluzby-title">
    <div ref="el" class="container reveal" :class="{ 'is-visible': visible }">
      <SectionLabel :text="services.label" />
      <GlitchHeading :text="services.title" :level="2" />
      <span id="sluzby-title" class="visually-hidden">{{ services.title }}</span>

      <ul class="grid">
        <li v-for="service in services.items" :key="service.id" class="card bevel-tl">
          <h3>{{ service.title }}</h3>
          <p>{{ service.description }}</p>
          <ul class="stack mono">
            <li v-for="tech in service.stack" :key="tech">{{ tech }}</li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding-block: var(--section-gap);
}

.grid {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
  transition:
    border-color var(--dur-fast) var(--ease),
    background-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.card:hover {
  border-color: var(--cp-yellow);
  background: var(--cp-panel-hi);
  transform: translateY(-2px);
}

.card h3 {
  color: var(--cp-yellow);
}

.card p {
  flex: 1;
  color: var(--cp-muted);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: auto;
}

.stack li {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--cp-line);
  color: var(--cp-cyan);
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
