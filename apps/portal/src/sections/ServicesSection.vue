<script setup lang="ts">
import SectionHeading from '@/components/SectionHeading.vue';
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
      <SectionHeading :text="t('portal.services.title')" :level="2" />
      <span id="sluzby-title" class="visually-hidden">{{ t('portal.services.title') }}</span>

      <ul class="grid">
        <li v-for="service in services" :key="service.id" class="card glass">
          <h3>{{ t(`portal.services.items.${service.id}.title`) }}</h3>
          <p>{{ t(`portal.services.items.${service.id}.description`) }}</p>
          <ul class="stack">
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
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition:
    border-color var(--dur-fast) var(--ease),
    background-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.card:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-strong);
  transform: translateY(-2px);
}

.card h3 {
  font-size: 1.25rem;
}

.card p {
  flex: 1;
  color: var(--color-muted);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: auto;
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
