<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost';
    href?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
  }>(),
  { variant: 'primary', type: 'button', disabled: false },
);

/*
 * Cesta na tomhle webu se prochází routerem, ne celou stránkou – produkty
 * jsou od sloučení součástí portálu, takže by šlo o zbytečný reload.
 */
const internal = computed(() => props.href?.startsWith('/') && !props.href.startsWith('//'));
</script>

<template>
  <!-- Odkaz i tlačítko sdílí vzhled, ale zůstávají správným prvkem kvůli klávesnici. -->
  <RouterLink v-if="href && internal" :to="href" class="app-btn" :class="variant">
    <span><slot /></span>
  </RouterLink>
  <a v-else-if="href" :href="href" class="app-btn" :class="variant">
    <span><slot /></span>
  </a>
  <button v-else class="app-btn" :class="variant" :type="type" :disabled="disabled">
    <span><slot /></span>
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: var(--touch-target);
  min-width: var(--touch-target);
  padding: 0.7rem 1.5rem;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  background: transparent;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: -0.005em;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease),
    box-shadow var(--dur-base) var(--ease),
    color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.app-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* Hlavní akce: oranžová pilulka se světlem na horní hraně a jemnou září. */
.primary {
  background: linear-gradient(180deg, var(--color-accent-strong), var(--color-accent));
  color: var(--color-on-accent);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.35),
    0 10px 30px -12px var(--color-accent-glow);
}

.primary:hover:not(:disabled) {
  color: var(--color-on-accent);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.35),
    0 14px 38px -10px var(--color-accent-glow);
}

/* Vedlejší akce: skleněná pilulka. */
.ghost {
  border-color: var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

.ghost:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  background: var(--color-surface-strong);
  color: var(--color-text);
}
</style>
