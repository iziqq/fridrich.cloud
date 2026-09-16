<script setup lang="ts">
defineProps<{ icon?: string; title: string; description?: string }>();
</script>

<template>
  <div class="empty">
    <p v-if="icon" class="icon" aria-hidden="true">{{ icon }}</p>
    <p class="title">{{ title }}</p>
    <p v-if="description" class="description">{{ description }}</p>
    <div v-if="$slots.default" class="action"><slot /></div>
  </div>
</template>

<style scoped>
.empty {
  padding: var(--space-6) var(--space-2);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  text-align: center;
}

.icon {
  font-size: 2rem;
}

.title {
  margin: var(--space-1) auto 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
}

.description {
  margin: 0.35rem auto 0;
  max-width: 34ch;
  color: var(--color-muted);
  font-size: 0.9375rem;
}

.action {
  margin-top: var(--space-2);
}
</style>
