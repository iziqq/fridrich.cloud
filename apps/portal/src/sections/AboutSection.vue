<script setup lang="ts">
import GlitchHeading from '@/components/GlitchHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { about } from '@/content/site';
import { useReveal } from '@/composables/useReveal';

const { el, visible } = useReveal();
</script>

<template>
  <section id="o-mne" class="section" aria-labelledby="o-mne-title">
    <div ref="el" class="container reveal" :class="{ 'is-visible': visible }">
      <SectionLabel :text="about.label" />
      <GlitchHeading :text="about.title" :level="2" />
      <span id="o-mne-title" class="visually-hidden">{{ about.title }}</span>

      <div class="body">
        <div class="text">
          <p v-for="(paragraph, index) in about.paragraphs" :key="index">{{ paragraph }}</p>
        </div>

        <ul class="stats">
          <li v-for="stat in about.stats" :key="stat.label" class="stat bevel-sm">
            <span class="value text-glow-yellow">
              {{ stat.value }}<span v-if="stat.suffix" class="suffix">{{ stat.suffix }}</span>
            </span>
            <span class="mono label">{{ stat.label }}</span>
          </li>
        </ul>
      </div>

      <div class="sectors">
        <p class="mono sectors-label">{{ about.sectorsLabel }}</p>
        <ul class="sector-list">
          <li v-for="sector in about.sectors" :key="sector">{{ sector }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding-block: var(--section-gap);
}

.body {
  display: grid;
  gap: var(--space-6);
  margin-top: var(--space-4);
}

.text p + p {
  margin-top: var(--space-2);
}

.stats {
  display: grid;
  gap: var(--space-2);
  align-content: start;
}

.stat {
  padding: var(--space-2);
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
}

.value {
  display: block;
  color: var(--cp-yellow);
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.suffix {
  color: var(--cp-cyan);
}

.label {
  color: var(--cp-muted);
}

.sectors {
  margin-top: var(--space-6);
  padding-top: var(--space-3);
  border-top: 1px solid var(--cp-line);
}

.sectors-label {
  color: var(--cp-cyan);
}

.sector-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.sector-list li {
  color: var(--cp-muted);
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  transition: color var(--dur-fast) var(--ease);
}

.sector-list li:hover {
  color: var(--cp-text);
}

@media (--notebook) {
  .body {
    grid-template-columns: 1.6fr 1fr;
    gap: var(--space-8);
  }
}
</style>
