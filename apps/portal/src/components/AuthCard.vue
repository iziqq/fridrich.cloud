<script setup lang="ts">
import SectionHeading from './SectionHeading.vue';
import SectionLabel from './SectionLabel.vue';

defineProps<{ label: string; title: string }>();
</script>

<template>
  <section class="page">
    <div class="container">
      <div class="card glass">
        <SectionLabel :text="label" />
        <SectionHeading :text="title" :level="1" />

        <div class="body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="foot">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  place-items: center;
  min-height: 100svh;
  padding-block: 9rem var(--space-8);
}

.container {
  display: grid;
  justify-items: center;
}

.card {
  width: 100%;
  max-width: 30rem;
  padding: var(--space-4) var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.card :deep(h1) {
  font-size: clamp(1.75rem, 1.2rem + 2.5vw, 2.5rem);
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.foot {
  margin-top: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: var(--text-sm);
}

.foot :deep(a) {
  color: var(--color-accent-soft);
  text-decoration: none;
}

.foot :deep(a:hover) {
  color: var(--color-accent);
}
</style>
