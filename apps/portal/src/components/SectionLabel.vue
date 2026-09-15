<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<template>
  <p class="section-label mono">{{ text }}</p>
</template>

<style scoped>
/* Štítek nad nadpisem sekce – malá skleněná pilulka s oranžovou tečkou. */
.section-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: var(--space-2);
  padding: 0.35rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-accent-soft);
}

.section-label::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 10px var(--color-accent-glow);
}
</style>
