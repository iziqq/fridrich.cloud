<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import LocaleSwitcher from '@/components/LocaleSwitcher.vue';
import { weddyPath } from '@/weddy/routes';
import { useWeddingStore } from './wedding.store';

const { t } = useI18n();
const route = useRoute();
const weddings = useWeddingStore();

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));

/*
 * Detail svatby potřebuje název do hlavičky i data do formuláře snoubenců.
 * Načítá se tady, protože je to nejvyšší místo, které svatbu zná – jako
 * hlídač v routeru by to běželo i pro stránky portálu, které o plánovači
 * nevědí. `immediate` pokryje první zobrazení, watch pak přepnutí svatby.
 */
watch(weddingId, (id) => id && weddings.loadOne(id), { immediate: true });

/*
 * Záložky. Nastavení vidí jen admin, takže manager i viewer mají o jednu
 * méně – na mobilu je tak pořád co nejširší (doc/wiki/domains/weddyWedding.md).
 */
const tabs = computed(() => {
  const base = [
    { to: weddyPath(`/weddings/${weddingId.value}/couple`), icon: '💑', label: t('weddy.layout.tabs.couple') },
    { to: weddyPath(`/weddings/${weddingId.value}/guests`), icon: '👥', label: t('weddy.layout.tabs.guests') },
    { to: weddyPath(`/weddings/${weddingId.value}/planning`), icon: '📋', label: t('weddy.layout.tabs.planning') },
    { to: weddyPath(`/weddings/${weddingId.value}/budget`), icon: '💰', label: t('weddy.layout.tabs.budget') },
  ];

  if (!weddings.canManageSettings) return base;

  return [
    ...base,
    { to: weddyPath(`/weddings/${weddingId.value}/settings`), icon: '⚙️', label: t('weddy.layout.tabs.settings') },
  ];
});

/** Viewer nesmí nic měnit – ať to ví dřív, než na něco klikne. */
const readonly = computed(() => weddings.current !== null && !weddings.canEdit);

const title = computed(() => weddings.current?.title ?? t('weddy.layout.fallbackTitle'));
</script>

<template>
  <div class="layout">
    <header class="top">
      <div class="container bar">
        <RouterLink :to="weddyPath()" class="back" :aria-label="t('weddy.layout.back')">
          <span aria-hidden="true">←</span>
        </RouterLink>
        <h1>{{ title }}</h1>
        <span v-if="readonly" class="readonly">{{ t('weddy.layout.readonly') }}</span>
        <!-- Plánovač nemá navigaci portálu, jazyk se proto přepíná v horní liště. -->
        <LocaleSwitcher class="locale" />
      </div>
    </header>

    <main id="obsah" class="container page">
      <RouterView />
    </main>

    <!-- Spodní navigace v dosahu palce (doc/wiki/domains/weddy.md). -->
    <nav class="bottom" :aria-label="t('weddy.layout.sections')">
      <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tab">
        <span class="icon" aria-hidden="true">{{ tab.icon }}</span>
        <span class="label">{{ tab.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.readonly {
  flex-shrink: 0;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--sand-100);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

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

/* Název se zkracuje výpustkou, přepínač jazyka zůstává vpravo v plné velikosti. */
.bar h1 {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 1.125rem;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.locale {
  flex-shrink: 0;
  margin-right: calc(var(--gutter) * -0.5);
}

.bottom {
  position: fixed;
  inset: auto 0 0;
  z-index: 50;
  display: grid;
  /* Počet záložek se liší podle role (admin jich má pět), proto auto-columns
     – `repeat(var(--tab-count), …)` není platné CSS a rozpadlo by se to do řádků. */
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
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
