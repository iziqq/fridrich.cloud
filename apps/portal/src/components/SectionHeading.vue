<script setup lang="ts">
import { computed } from 'vue';
import { useReveal } from '@/composables/useReveal';

const props = withDefaults(defineProps<{ text: string; level?: 1 | 2 | 3 }>(), {
  level: 2,
});

const tag = computed(() => `h${props.level}`);
const { el, visible } = useReveal(0.4);
</script>

<template>
  <component :is="tag" ref="el">
    <!-- data-text nese kopii textu pro barevné glitch vrstvy v ::before/::after -->
    <span class="glitch" :class="{ 'is-visible': visible }" :data-text="props.text">
      {{ props.text }}
    </span>
  </component>
</template>
