<script setup lang="ts">
import GlitchHeading from '@/components/GlitchHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { useI18n } from 'vue-i18n';
import { services, type StackTag } from '@/content/site';
import { useReveal } from '@/composables/useReveal';

const { t } = useI18n();
const { el, visible } = useReveal();

/** Název technologie zůstává, téma se přeloží. */
function tagLabel(tag: StackTag): string {
  return typeof tag === 'string' ? tag : t(`portal.services.topics.${tag.topic}`);
}
</script>

<template>
  <section id="sluzby" class="section" aria-labelledby="sluzby-title">
    <div ref="el" class="container reveal" :class="{ 'is-visible': visible }">
      <SectionLabel :text="t('portal.services.label')" />
      <GlitchHeading :text="t('portal.services.title')" :level="2" />
      <span id="sluzby-title" class="visually-hidden">{{ t('portal.services.title') }}</span>

      <ul class="grid">
        <li v-for="service in services" :key="service.id" class="card bevel-tl">
          <h3>{{ t(`portal.services.items.${service.id}.title`) }}</h3>
          <p>{{ t(`portal.services.items.${service.id}.description`) }}</p>
          <ul class="stack mono">
            <li v-for="tag in service.stack" :key="typeof tag === 'string' ? tag : tag.topic">
              {{ tagLabel(tag) }}
            </li>
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

@media (--tablet) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (--notebook) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
