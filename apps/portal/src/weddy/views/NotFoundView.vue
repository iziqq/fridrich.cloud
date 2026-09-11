<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { weddyPath } from '@/weddy/routes';
</script>

<template>
  <main id="obsah" class="container page">
    <h1>Stránka nenalezena</h1>
    <p>Tahle adresa v plánovači neexistuje.</p>
    <RouterLink :to="weddyPath()" class="btn btn-primary">Zpět na přehled</RouterLink>
  </main>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-2);
  place-content: center;
  min-height: 70svh;
  text-align: center;
}

p {
  margin-inline: auto;
  color: var(--color-muted);
}

.btn {
  justify-self: center;
}
</style>
