<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { navItems, site } from '@/content/site';
import { useActiveSection } from '@/composables/useActiveSection';
import { useAuthStore } from '@/identity/auth.store';

const route = useRoute();
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
  // kterou JavaScript nepřečte.
  void auth.load();
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
    <nav class="bar bevel-sm" aria-label="Hlavní navigace">
      <RouterLink to="/" class="logo" aria-label="Domů">
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
            {{ item.label }}
          </a>
        </li>
      </ul>

      <span class="divider" aria-hidden="true"></span>

      <RouterLink v-if="auth.isAuthenticated" to="/ucet" class="login account">
        {{ auth.user?.displayName }}
      </RouterLink>
      <RouterLink v-else to="/prihlaseni" class="login">Přihlásit se</RouterLink>

      <button
        class="toggle"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        @click="menuOpen = !menuOpen"
      >
        <span class="visually-hidden">{{ menuOpen ? 'Zavřít menu' : 'Otevřít menu' }}</span>
        <span class="bars" :class="{ 'is-open': menuOpen }" aria-hidden="true"></span>
      </button>
    </nav>

    <!-- Mobilní menu přes celou obrazovku, položky nabíhají jako boot sekvence. -->
    <div v-if="menuOpen" id="mobile-menu" class="overlay scanlines">
      <ul>
        <li v-for="(item, index) in navItems" :key="item.hash" :style="{ '--i': index }">
          <a :href="target(item.hash)" @click="menuOpen = false">
            <span class="mono index">{{ String(index + 1).padStart(2, '0') }}</span>
            {{ item.label }}
          </a>
        </li>
        <li class="overlay-login" :style="{ '--i': navItems.length }">
          <RouterLink v-if="auth.isAuthenticated" to="/ucet">
            {{ auth.user?.displayName }}
          </RouterLink>
          <RouterLink v-else to="/prihlaseni">Přihlásit se</RouterLink>
        </li>
      </ul>
      <p class="mono overlay-foot">{{ site.domain }}</p>
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

.bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  max-width: var(--content-max);
  padding: 0.5rem 0.75rem 0.5rem 1rem;
  border: 1px solid var(--cp-line);
  background: color-mix(in srgb, var(--cp-panel) 88%, transparent);
  backdrop-filter: blur(12px);
}

.logo {
  display: grid;
  place-items: center;
  min-width: 2.75rem;
  min-height: 2.75rem;
  color: var(--cp-yellow);
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
  padding-inline: 0.25rem;
  color: var(--cp-text);
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition:
    color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.links a:hover,
.login:hover {
  color: var(--cp-yellow);
  transform: translate(-1px, -1px);
}

.links a.is-active {
  color: var(--cp-yellow);
}

.divider {
  display: none;
  width: 1px;
  height: 1.5rem;
  background: var(--cp-line);
}

.login {
  display: none;
  color: var(--cp-muted);
}

/* Přihlášený uživatel je viditelnější než výzva k přihlášení. */
.login.account {
  color: var(--cp-yellow);
}

.toggle {
  display: grid;
  place-items: center;
  min-width: 2.75rem;
  min-height: 2.75rem;
  margin-left: auto;
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
  background: var(--cp-text);
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
  background: var(--cp-black);
}

.overlay li {
  border-bottom: 1px solid var(--cp-line);
  opacity: 0;
  animation: boot 180ms var(--ease) forwards;
  animation-delay: calc(var(--i) * 45ms);
}

.overlay a {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  color: var(--cp-text);
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
}

.overlay .index {
  color: var(--cp-cyan);
}

.overlay-login a {
  color: var(--cp-yellow);
}

.overlay-foot {
  margin-top: var(--space-4);
  color: var(--cp-muted);
}

@keyframes boot {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (min-width: 768px) {
  .links,
  .divider,
  .login {
    display: flex;
  }

  .toggle {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overlay li {
    opacity: 1;
    animation: none;
  }
}
</style>
