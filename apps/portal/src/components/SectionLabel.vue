<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<template>
  <p class="section-label mono">{{ text }}</p>
</template>

<style scoped>
.section-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  color: var(--cp-cyan);
}

.section-label::after {
  content: '';
  flex: 1;
  height: 1px;
  max-width: 8rem;
  background: linear-gradient(to right, var(--cp-cyan), transparent);
}
</style>
