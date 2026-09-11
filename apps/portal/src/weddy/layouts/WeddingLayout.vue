<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { useWeddingsStore } from '@/stores/weddings';

const route = useRoute();
const weddings = useWeddingsStore();

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));

const tabs = computed(() => [
  { to: `/weddings/${weddingId.value}/couple`, icon: '💑', label: 'Snoubenci' },
  { to: `/weddings/${weddingId.value}/guests`, icon: '👥', label: 'Hosté' },
  { to: `/weddings/${weddingId.value}/planning`, icon: '📋', label: 'Plánování' },
  { to: `/weddings/${weddingId.value}/budget`, icon: '💰', label: 'Rozpočet' },
]);

const title = computed(() => weddings.current?.title ?? 'Plánování');
</script>

<template>
  <div class="layout">
    <header class="top">
      <div class="container bar">
        <RouterLink to="/" class="back" aria-label="Zpět na přehled">
          <span aria-hidden="true">←</span>
        </RouterLink>
        <h1>{{ title }}</h1>
      </div>
    </header>

    <main id="obsah" class="container page">
      <RouterView />
    </main>

    <!-- Spodní navigace v dosahu palce (doc/iziweddy.md, kap. 6.2). -->
    <nav class="bottom" aria-label="Sekce plánování">
      <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tab">
        <span class="icon" aria-hidden="true">{{ tab.icon }}</span>
        <span class="label">{{ tab.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.top {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  backdrop-filter: blur(8px);
}

.bar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  min-height: 3.5rem;
}

.back {
  display: grid;
  place-items: center;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  margin-left: calc(var(--gutter) * -0.5);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 1.25rem;
  text-decoration: none;
}

.back:hover {
  background: var(--sand-100);
  color: var(--color-accent);
}

.bar h1 {
  overflow: hidden;
  font-size: 1.125rem;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.bottom {
  position: fixed;
  inset: auto 0 0;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  padding-bottom: env(safe-area-inset-bottom);
}

.tab {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  align-items: center;
  justify-content: center;
  min-height: var(--bottom-nav);
  color: var(--color-muted);
  font-size: 0.6875rem;
  font-weight: 600;
  text-decoration: none;
  transition: color var(--dur-fast) var(--ease);
}

.tab .icon {
  font-size: 1.25rem;
  line-height: 1;
}

/* Aktivní záložku pozná uživatel podle barvy i podle linky nahoře. */
.tab.router-link-active {
  position: relative;
  color: var(--color-accent);
}

.tab.router-link-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 2rem;
  height: 2px;
  border-radius: 0 0 2px 2px;
  background: var(--color-accent);
  transform: translateX(-50%);
}
</style>
