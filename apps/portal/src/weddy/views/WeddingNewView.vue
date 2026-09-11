<script setup lang="ts">
import type { Wedding } from '@fridrich/weddy-shared';
import { RouterLink, useRouter } from 'vue-router';
import WeddingForm from '@/components/WeddingForm.vue';
import { useWeddingsStore } from '@/stores/weddings';

const weddings = useWeddingsStore();
const router = useRouter();

async function onSaved(wedding: Wedding): Promise<void> {
  await router.replace(`/weddings/${wedding.id}/couple`);
}
</script>

<template>
  <div class="page-new container">
    <RouterLink to="/" class="back">← Zpět na přehled</RouterLink>
    <h1>Nové plánování</h1>
    <p class="lead">Stačí název a jména snoubenců, zbytek se dá doplnit kdykoli později.</p>

    <WeddingForm
      submit-label="Založit plánování"
      :save="(input) => weddings.create(input)"
      @saved="onSaved"
    />
  </div>
</template>

<style scoped>
.page-new {
  padding-block: var(--space-3) var(--space-8);
}

.back {
  display: inline-block;
  margin-bottom: var(--space-2);
  color: var(--color-muted);
  font-size: 0.875rem;
  text-decoration: none;
}

.back:hover {
  color: var(--color-accent);
}

h1 {
  font-size: 1.75rem;
}

.lead {
  margin-bottom: var(--space-3);
  color: var(--color-muted);
}
</style>
