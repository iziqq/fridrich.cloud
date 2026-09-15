<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ text: string; level?: 1 | 2 | 3 }>(), {
  level: 2,
});

const tag = computed(() => `h${props.level}`);
</script>

<template>
  <component :is="tag" class="section-heading">{{ props.text }}</component>
</template>

<style scoped>
.section-heading {
  max-width: 22ch;
}
</style>
