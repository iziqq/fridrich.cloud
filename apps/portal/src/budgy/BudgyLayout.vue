<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import LocaleSwitcher from '@/components/LocaleSwitcher.vue';
import { currentLocale } from '@/i18n';
import { budgyPath } from './routes';
import { useBudgetStore } from './budget/budget.store';

/**
 * Obal obrazovek rozpočtu – horní lišta a jeden `main#obsah` pro všechny.
 *
 * Produkt nemá navigaci portálu (`meta.bare`), takže cesta zpět na rozcestník,
 * přepínání obrazovek i jazyka musí být tady. Lišta je ve dvou řadách: značka
 * s jazykem nahoře, záložky pod nimi – na 360 px se tři věci vedle sebe
 * nevejdou, aniž by se popisky ořízly.
 */
const { t } = useI18n();
const route = useRoute();
const store = useBudgetStore();

/** Název právě prohlíženého měsíce – záložka ho ukazuje místo obecného slova. */
const monthLabel = computed(() =>
  new Intl.DateTimeFormat(currentLocale.value, { month: 'long', timeZone: 'UTC' }).format(
    new Date(`${store.month}-01T00:00:00.000Z`),
  ),
);

const tabs = computed(() => [
  { to: budgyPath(), label: t('budgy.layout.tabs.dashboard') },
  { to: budgyPath('/mesic'), label: t('budgy.layout.tabs.month', { month: monthLabel.value }) },
]);
</script>

<template>
  <div>
    <header class="bar">
      <div class="container top">
        <RouterLink to="/" class="back">{{ t('budgy.layout.back') }}</RouterLink>
        <RouterLink :to="budgyPath()" class="brand">{{ t('budgy.layout.title') }}</RouterLink>
        <LocaleSwitcher class="locale" />
      </div>

      <nav class="container tabs" :aria-label="t('budgy.layout.tabsLabel')">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="tab"
          :class="{ 'is-active': route.path === tab.to }"
        >
          {{ tab.label }}
        </RouterLink>
      </nav>
    </header>

    <main id="obsah" class="container page">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.bar {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-bg) 92%, transparent);
  backdrop-filter: blur(8px);
}

.top {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  min-height: 3rem;
}

.back {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-muted);
  font-size: var(--text-sm);
  text-decoration: none;
  white-space: nowrap;
}

.back:hover {
  color: var(--color-accent);
}

.brand {
  margin-right: auto;
  color: var(--color-text);
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
}

.tabs {
  display: flex;
  gap: 0.35rem;
  /* Kdyby záložek přibylo, ať se dají odscrollovat místo zalomení. */
  overflow-x: auto;
  padding-bottom: 0.4rem;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  padding: 0.4rem 0.85rem;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--color-muted);
  font-size: var(--text-sm);
  text-decoration: none;
  white-space: nowrap;
  text-transform: capitalize;
  transition:
    background-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);
}

.tab:hover {
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.tab.is-active {
  border-color: var(--color-border);
  background: var(--color-surface);
  color: var(--color-accent);
  font-weight: 600;
}
</style>
