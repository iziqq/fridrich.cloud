<script setup lang="ts">
defineProps<{ message: string }>();
</script>

<template>
  <p class="error" role="alert">{{ message }}</p>
</template>

<style scoped>
.error {
  padding: var(--space-2);
  border: 1px solid #eecdc7;
  border-radius: var(--radius-sm);
  background: #fbeeeb;
  color: #96412f;
}
</style>
