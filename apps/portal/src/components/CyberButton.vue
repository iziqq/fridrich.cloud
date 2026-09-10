<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost';
    href?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
  }>(),
  { variant: 'primary', type: 'button', disabled: false },
);
</script>

<template>
  <!-- Odkaz i tlačítko sdílí vzhled, ale zůstávají správným prvkem kvůli klávesnici. -->
  <a v-if="href" :href="href" class="cyber-btn bevel-sm" :class="variant">
    <span><slot /></span>
  </a>
  <button v-else class="cyber-btn bevel-sm" :class="variant" :type="type" :disabled="disabled">
    <span><slot /></span>
  </button>
</template>

<style scoped>
.cyber-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 2.75rem;
  min-width: 2.75rem;
  padding: 0.75rem 1.75rem;
  border: 1px solid transparent;
  background: transparent;
  font-family: var(--font-display);
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease),
    filter var(--dur-fast) var(--ease);
}

.cyber-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.primary {
  background: var(--cp-yellow);
  color: var(--cp-black);
}

/* drop-shadow respektuje clip-path, box-shadow by se ořízl spolu s tvarem. */
.primary:hover:not(:disabled) {
  color: var(--cp-black);
  transform: translate(-2px, -2px);
  filter: drop-shadow(4px 4px 0 var(--cp-cyan));
}

.ghost {
  border-color: var(--cp-line);
  color: var(--cp-text);
}

.ghost:hover:not(:disabled) {
  border-color: var(--cp-yellow);
  color: var(--cp-yellow);
  transform: translate(-2px, -2px);
}
</style>
