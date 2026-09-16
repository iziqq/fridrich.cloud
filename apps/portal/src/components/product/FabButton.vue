<script setup lang="ts">
defineProps<{ label: string }>();
defineEmits<{ click: [] }>();
</script>

<template>
  <!-- Hlavní akce stránky jako plovoucí tlačítko v dosahu palce (doc/wiki/domains/weddy.md). -->
  <button type="button" class="fab" @click="$emit('click')">
    <span class="plus" aria-hidden="true">+</span>
    <span class="label">{{ label }}</span>
  </button>
</template>

<style scoped>
.fab {
  position: fixed;
  right: var(--gutter);
  bottom: calc(var(--bottom-nav) + var(--space-2) + env(safe-area-inset-bottom));
  z-index: 40;
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  min-height: var(--touch-target);
  padding: 0.75rem 1.25rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 0.9375rem;
  font-weight: 600;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease);
}

.fab:hover {
  background: var(--color-accent-strong);
}

.plus {
  font-size: 1.25rem;
  line-height: 1;
}
</style>
