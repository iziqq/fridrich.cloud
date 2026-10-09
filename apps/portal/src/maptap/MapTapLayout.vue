<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import LocaleSwitcher from '@/components/LocaleSwitcher.vue';
import { maptapPath } from './routes';

/**
 * Obal obrazovek tabule – horní lišta a jeden `main#obsah` pro všechny.
 *
 * Aplikace nemá navigaci portálu (`meta.bare`), takže cesta zpět na rozcestník,
 * přepínání obrazovek i jazyka musí být tady. Lišta je ve dvou řadách: značka
 * s jazykem nahoře, záložky pod nimi – na 360 px se tři věci vedle sebe
 * nevejdou, aniž by se popisky ořízly.
 */
const { t } = useI18n();
const route = useRoute();

const tabs = computed(() => [
  { to: maptapPath(), label: t('maptap.layout.tabs.day') },
  { to: maptapPath('/poradi'), label: t('maptap.layout.tabs.standings') },
]);
</script>

<template>
  <div>
    <!-- Plovoucí skleněná lišta – stejný prvek jako navigace portálu. -->
    <header class="bar-wrap">
      <div class="bar">
        <div class="top">
          <RouterLink to="/" class="back">{{ t('maptap.layout.back') }}</RouterLink>
          <RouterLink :to="maptapPath()" class="brand">{{ t('maptap.layout.title') }}</RouterLink>
          <LocaleSwitcher class="locale" />
        </div>

        <nav class="tabs" :aria-label="t('maptap.layout.tabsLabel')">
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
      </div>
    </header>

    <main id="obsah" class="container page">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/*
 * Lišta se veze s sebou a plave nad obsahem.
 *
 * Obal drží odsazení od okrajů, takže se sklo nedotýká hran okna – přesně
 * jako pilulka navigace na portálu. Obsah se pod ní prosvítá, to je ten
 * efekt; `sticky` na obalu zároveň nechá lištu zabrat místo v toku, takže
 * pod ní nic nezačíná schované.
 */
.bar-wrap {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: var(--space-2) var(--gutter) 0;
}

.bar {
  max-width: var(--content-max);
  margin-inline: auto;
  padding: 0.25rem 0.5rem 0.4rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgb(20 20 24 / 0.55);
  box-shadow: var(--shadow-glass);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
}

/* Bez podpory rozostření by průsvitná lišta splynula s obsahem pod sebou. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .bar {
    background: #16161b;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .bar {
    background: #16161b;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

.top {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  min-height: 2.75rem;
  padding-inline: 0.375rem;
}

.back {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  padding-inline: 0.5rem;
  border-radius: var(--radius-pill);
  color: var(--color-muted);
  font-size: var(--text-sm);
  text-decoration: none;
  white-space: nowrap;
}

.back:hover {
  background: var(--color-surface-strong);
  color: var(--color-accent);
}

.brand {
  margin-inline: 0.35rem auto;
  color: var(--color-text);
  font-weight: 650;
  letter-spacing: -0.025em;
  text-decoration: none;
}

.tabs {
  display: flex;
  gap: 0.35rem;
  /* Kdyby záložek přibylo, ať se dají odscrollovat místo zalomení. */
  overflow-x: auto;
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
  border-radius: var(--radius-pill);
  color: var(--color-muted);
  font-size: var(--text-sm);
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);
}

.tab:hover {
  background: var(--color-surface-alt);
  color: var(--color-text);
}

/* Aktivní obrazovka: jemně podsvícená pilulka jako v navigaci portálu. */
.tab.is-active {
  background: var(--color-surface-strong);
  color: var(--color-accent-soft);
  font-weight: 600;
}
</style>
