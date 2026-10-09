<script setup lang="ts">
defineProps<{ message: string }>();
</script>

<template>
  <p class="error" role="alert">{{ message }}</p>
</template>

<style scoped>
/*
 * Chyba se míchá z `--color-danger` a ploch tématu, ne z pevných odstínů:
 * stejná komponenta tak sedí do světlého plánovače i do tmavé tabule
 * (CLAUDE.md, pravidlo 23).
 *
 * Text není čistá `--color-danger`, ale přitažená k barvě písma tématu.
 * Samotná červená má na světlém podkladu kontrast jen 3,75 : 1; s příměsí
 * 20 % textové barvy je to 4,9 : 1 na světlém a 6,1 : 1 na tmavém.
 */
.error {
  padding: var(--space-2);
  border: 1px solid color-mix(in srgb, var(--color-danger) 35%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-danger) 12%, var(--color-surface));
  color: color-mix(in srgb, var(--color-danger) 80%, var(--color-text));
}
</style>
