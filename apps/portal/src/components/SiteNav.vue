<script setup lang="ts">
import { PERSONAL_DATA_COLLECTION_ENABLED } from '@fridrich/shared';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import LocaleSwitcher from '@/components/LocaleSwitcher.vue';
import { navItems, site } from '@/content/site';
import { useActiveSection } from '@/composables/useActiveSection';
import { useAuthStore } from '@/identity/auth.store';

const route = useRoute();
const { t } = useI18n();
const auth = useAuthStore();

const menuOpen = ref(false);
const hidden = ref(false);

const sectionIds = navItems.map((item) => item.hash.slice(1));
const activeSection = useActiveSection(sectionIds);

let lastScroll = 0;

function onScroll(): void {
  const current = window.scrollY;
  // Lišta se schová při scrollu dolů a vrátí při scrollu nahoru.
  hidden.value = current > 160 && current > lastScroll && !menuOpen.value;
  lastScroll = current;
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });

  // Stav přihlášení se zjišťuje dotazem na API – session drží httpOnly cookie,
  // kterou JavaScript nepřečte. Bez sběru osobních údajů přihlášení není,
  // takže se ani neptáme.
  if (PERSONAL_DATA_COLLECTION_ENABLED) void auth.load();
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  document.body.style.removeProperty('overflow');
});

// Otevřené celoobrazovkové menu nesmí scrollovat stránku pod sebou.
watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
});

// Přechod na jinou stránku menu vždy zavře.
watch(() => route.fullPath, () => (menuOpen.value = false));

function isActive(hash: string): boolean {
  return route.path === '/' && activeSection.value === hash.slice(1);
}

/** Na podstránkách musí kotva vést zpět na domovskou stránku. */
function target(hash: string): string {
  return route.path === '/' ? hash : `/${hash}`;
}
</script>

<template>
  <header class="site-nav" :class="{ 'is-hidden': hidden }">
    <nav class="bar glass" :aria-label="t('portal.nav.label')">
      <RouterLink to="/" class="logo" :aria-label="t('portal.nav.home')">
        <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
          <path
            d="M4 4h10v3H7v6h6v3H7v12H4V4Zm14 0h3v19h7v3h-10V4Z"
            fill="currentColor"
          />
        </svg>
      </RouterLink>

      <ul class="links">
        <li v-for="item in navItems" :key="item.hash">
          <a :href="target(item.hash)" :class="{ 'is-active': isActive(item.hash) }">
            {{ t(`portal.nav.items.${item.id}`) }}
          </a>
        </li>
      </ul>

      <template v-if="PERSONAL_DATA_COLLECTION_ENABLED">
        <span class="divider" aria-hidden="true"></span>

        <RouterLink v-if="auth.isAuthenticated" to="/ucet" class="login account">
          {{ auth.user?.displayName }}
        </RouterLink>
        <RouterLink v-else to="/prihlaseni" class="login">{{ t('portal.nav.login') }}</RouterLink>
      </template>

      <!-- Jazyk jde přepnout na každé šířce – na mobilu sedí vedle tlačítka menu. -->
      <LocaleSwitcher class="bar-locale" />

      <button
        class="toggle"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        @click="menuOpen = !menuOpen"
      >
        <span class="visually-hidden">{{ menuOpen ? t('portal.nav.closeMenu') : t('portal.nav.openMenu') }}</span>
        <span class="bars" :class="{ 'is-open': menuOpen }" aria-hidden="true"></span>
      </button>
    </nav>

    <!-- Mobilní menu přes celou obrazovku na matném skle, položky postupně najíždějí. -->
    <div v-if="menuOpen" id="mobile-menu" class="overlay">
      <ul>
        <li v-for="(item, index) in navItems" :key="item.hash" :style="{ '--i': index }">
          <a :href="target(item.hash)" @click="menuOpen = false">
            <span class="mono index">{{ String(index + 1).padStart(2, '0') }}</span>
            {{ t(`portal.nav.items.${item.id}`) }}
          </a>
        </li>
        <li
          v-if="PERSONAL_DATA_COLLECTION_ENABLED"
          class="overlay-login"
          :style="{ '--i': navItems.length }"
        >
          <RouterLink v-if="auth.isAuthenticated" to="/ucet">
            {{ auth.user?.displayName }}
          </RouterLink>
          <RouterLink v-else to="/prihlaseni">{{ t('portal.nav.login') }}</RouterLink>
        </li>
      </ul>
      <div class="overlay-foot">
        <LocaleSwitcher />
        <p class="mono">{{ site.domain }}</p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-nav {
  position: fixed;
  inset: var(--space-2) 0 auto;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding-inline: var(--gutter);
  transition: transform var(--dur-slow) var(--ease);
}

.site-nav.is-hidden {
  transform: translateY(calc(-100% - var(--space-4)));
}

/* Plovoucí skleněná pilulka – rozostření a okraj dodává třída glass. */
.bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  max-width: var(--content-max);
  padding: 0.375rem 0.5rem 0.375rem 0.875rem;
  border-radius: var(--radius-pill);
  background: rgb(20 20 24 / 0.55);
}

.logo {
  display: grid;
  place-items: center;
  min-width: 2.75rem;
  min-height: 2.75rem;
  color: var(--color-accent);
}

.links {
  display: none;
  flex: 1;
  gap: var(--space-3);
  margin: 0;
}

.links a,
.login {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding-inline: 0.875rem;
  border-radius: var(--radius-pill);
  color: var(--color-text);
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);
}

.links a:hover,
.login:hover {
  background: var(--color-surface-strong);
  color: var(--color-text);
}

/* Aktivní sekce: jemně podsvícená pilulka místo změny barvy textu. */
.links a.is-active {
  background: var(--color-surface-strong);
  color: var(--color-accent-soft);
}

.divider {
  display: none;
  width: 1px;
  height: 1.5rem;
  background: var(--color-border);
}

.login {
  display: none;
  color: var(--color-muted);
}

/* Přihlášený uživatel je viditelnější než výzva k přihlášení. */
.login.account {
  color: var(--color-accent);
}

/*
 * Na mobilu jsou odkazy skryté, takže přepínač s tlačítkem menu odsune doprava
 * sám přepínač. Od tabletu místo zabírají odkazy (`flex: 1`) a okraj vyjde nulový.
 */
.bar-locale {
  flex-shrink: 0;
  margin-left: auto;
}

.toggle {
  display: grid;
  place-items: center;
  min-width: 2.75rem;
  min-height: 2.75rem;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.bars,
.bars::before,
.bars::after {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--color-text);
  transition: transform var(--dur-fast) var(--ease);
}

.bars::before,
.bars::after {
  content: '';
  position: relative;
}

.bars::before {
  top: -6px;
}

.bars::after {
  top: 4px;
}

.bars.is-open {
  background: transparent;
}

.bars.is-open::before {
  transform: translateY(6px) rotate(45deg);
}

.bars.is-open::after {
  transform: translateY(-4px) rotate(-45deg);
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: -1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--space-8) var(--gutter) var(--space-4);
  background: rgb(11 11 14 / 0.72);
  backdrop-filter: blur(32px) saturate(160%);
  -webkit-backdrop-filter: blur(32px) saturate(160%);
}

.overlay li {
  border-bottom: 1px solid var(--color-border);
  opacity: 0;
  animation: slide-in 220ms var(--ease) forwards;
  animation-delay: calc(var(--i) * 45ms);
}

.overlay a {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  color: var(--color-text);
  font-size: 1.75rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  text-decoration: none;
}

.overlay .index {
  color: var(--color-accent);
}

.overlay-login a {
  color: var(--color-accent);
}

.overlay-foot {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-4);
  color: var(--color-muted);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/*
 * Na tabletu se do lišty vejde pět odkazů, přihlášení i přepínač jazyka jen
 * s menšími mezerami – s plnými by na 768 px přetekla. Plné mezery až od notebooku.
 */
@media (--tablet) {
  .bar {
    gap: var(--space-1);
  }

  .links {
    gap: 0;
  }

  .links,
  .divider,
  .login {
    display: flex;
  }

  .toggle {
    display: none;
  }
}

@media (--notebook) {
  .bar {
    gap: var(--space-2);
  }

  .links {
    gap: 0.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overlay li {
    opacity: 1;
    animation: none;
  }
}
</style>
